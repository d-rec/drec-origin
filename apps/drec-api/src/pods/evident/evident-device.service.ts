import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { Device } from '../device/device.entity';
import { DeviceService } from '../device/device.service';
import { InjectQueue } from '@nestjs/bull';
import { Queues } from '../../utils/enums/queues.enum';
import { Queue } from 'bull';
import { findCountryByCode } from '../../utils/get-country';
import { DocumentType } from '../document-uploads/entities/documents.entity';
import { convertToPowerUnit } from '../../utils/convert-to-power-units';
import {
  EvidentDeviceDetailsPayload,
  EvidentRegistrationStatus,
} from '../../types/evident';
import { EvidentService } from './evident.service';
import { MailService } from '../../mail/mail.service';
import { EnergyUnit } from '../../types/units';
import { OrganizationService } from '../organization/organization.service';
import EvidentDraftDeviceRegistrationTemplate, {
  getEvidentDraftDeviceRegistrationSubject,
} from './mail/evident-draft-device-registration.template';
import EvidentSubmittedDeviceRegistrationTemplate, {
  getEvidentSubmittedDeviceRegistrationSubject,
} from './mail/evident-submitted-device-registration.template';
import { DeviceGroupService } from '../device-group/device-group.service';
import { DeviceGroup } from '../device-group/device-group.entity';
import { AxiosResponse } from 'axios';
import { Organization } from '../organization/organization.entity';

@Injectable()
export class EvidentDeviceService {
  private readonly logger = new Logger(EvidentDeviceService.name);
  private issuerId = process.env.IREC_EVIDENT_ISSUER_ID || null;

  constructor(
    @InjectQueue(Queues.EvidentDeviceRegistration)
    private readonly evidentDeviceRegistrationQueue: Queue,
    @Inject(forwardRef(() => DeviceService))
    private readonly deviceService: DeviceService,
    private readonly evidentService: EvidentService,
    private mailService: MailService,
    @Inject(forwardRef(() => OrganizationService))
    private readonly organizationService: OrganizationService,
    @Inject(forwardRef(() => DeviceGroupService))
    private readonly deviceGroupService: DeviceGroupService,
  ) {}

  async fetchDevices(organizationId: number): Promise<any> {
    const evidentApiInstance =
      await this.evidentService.getApiInstance(organizationId);
    const response = await evidentApiInstance.get('/devices');
    return response.data;
  }

  private async registerDevice(device: Device): Promise<any> {
    try {
      const evidentApiInstance = await this.evidentService.getApiInstance(
        device.organizationId,
      );
      const response = await evidentApiInstance.post('/devices', {
        name: device.projectName,
        fuel: `/fuels/${device.fuelCode}`,
      });

      return response.data;
    } catch (error) {
      this.logger.error('Error registering device:', error.message);
      throw error;
    }
  }

  async saveDeviceDetails(
    device: Device,
    files: Record<string, Express.Multer.File[]>,
  ): Promise<EvidentDeviceDetailsPayload> {
    const registeredDevice = await this.registerDevice(device);
    device.evidentDeviceId = registeredDevice.code;
    const evidentApiInstance = await this.evidentService.getApiInstance(
      device.organizationId,
    );

    const { registrantId, id: evidentUserId } =
      await this.evidentService.getRegistrantInfo(device.organizationId);

    const organization =
      await this.organizationService.getLinkedMarketIntermediaryOrSelf(
        device.organizationId,
      );

    const uploadedFiles = await this.evidentService.uploadFiles(
      device,
      files,
      evidentUserId,
      this.getNotes(device),
    );

    const payload = this.generateDeviceDetailsPayload(
      device,
      registrantId,
      uploadedFiles,
    );

    if (device.capacity >= 250) {
      payload.issuer = await this.getIssuerForDevice(device);
    } else {
      payload.issuer = `/organisations/${this.issuerId}`;
    }

    console.log('payload', payload);
    let deviceResponse = await evidentApiInstance.post(
      '/device_details',
      payload,
    );

    if (device.capacity < 250) {
      deviceResponse = await this.submitDeviceForReview(device, payload);
    }

    await this.sendEvidentEmail(
      organization,
      device,
      deviceResponse.data.status,
    );
    await this.updateEvidentStatus(device, deviceResponse.data.status);
    return deviceResponse.data;
  }

  async saveDeviceGroupDetails(device: Device): Promise<void> {
    this.logger.verbose('Saving device group details');
    const evidentApiInstance = await this.evidentService.getApiInstance(
      device.organizationId,
    );
    const registeredDevice = await this.registerDevice(device);
    device.evidentDeviceId = registeredDevice.code;
    const { registrantId } = await this.evidentService.getRegistrantInfo(
      device.organizationId,
    );
    const payload = this.generateEvidentDeviceGroupPayload(
      device,
      registrantId,
    );
    console.log('payload', payload);
    await evidentApiInstance.post('/device_details', payload);
    this.logger.verbose('Device group details saved successfully');
    payload.status = EvidentRegistrationStatus.Submitted;
    const response = await evidentApiInstance.post('/device_details', payload);
    this.logger.verbose('Device group details saved successfully');
    console.log('response', response.data);
    await this.deviceGroupService.updateEvidentStatus(
      device.groupId,
      device['deviceGroupUid'],
      device.evidentDeviceId,
      response.data.status,
    );
  }

  async submitDeviceForReview(
    device: Device,
    payload: EvidentDeviceDetailsPayload,
  ): Promise<AxiosResponse<any>> {
    this.logger.verbose('Within device status update');
    const evidentApiInstance = await this.evidentService.getApiInstance(
      device.organizationId,
    );
    payload.status = EvidentRegistrationStatus.Submitted;
    const deviceResponse = await evidentApiInstance.post(
      '/device_details',
      payload,
    );
    return deviceResponse;
  }

  async queueDeviceRegistration(
    device: Device,
    files: {
      [DocumentType.FORM_SF_02]: Express.Multer.File[];
      [DocumentType.SF_02C]: Express.Multer.File[];
      [DocumentType.METERING_EVIDENCE]: Express.Multer.File[];
      [DocumentType.SINGLE_LINE_DIAGRAM]: Express.Multer.File[];
      [DocumentType.PROJECT_PHOTOS]: Express.Multer.File[];
    },
  ): Promise<void> {
    await this.evidentDeviceRegistrationQueue.add({
      device,
      files,
    });
  }

  async generateEvidentDeviceGroup(deviceGroup: DeviceGroup): Promise<void> {
    const devices = await this.deviceService.findByIds(deviceGroup.deviceIds);
    if (devices.length === 0) {
      this.logger.warn('No devices found for the provided device IDs');
      return;
    }

    const capacity = devices.reduce((sum, device) => sum + device.capacity, 0);
    const commissioningDate = devices.sort(
      (a: Device, b: Device) =>
        new Date(a.commissioningDate).getTime() -
        new Date(b.commissioningDate).getTime(),
    )[0].commissioningDate;
    const device: Device = devices[0];
    device.capacity = capacity;
    device.commissioningDate = commissioningDate;
    device.createdAt = new Date(commissioningDate);
    device['deviceGroupUid'] = deviceGroup.deviceGroupUid;
    device.projectName = deviceGroup.name;
    await this.saveDeviceGroupDetails(device);
  }

  private generateEvidentDeviceGroupPayload(
    device: Device,
    registrantId: string,
  ): any {
    const alpha2CountryCode = findCountryByCode(device.countryCode).alpha2;
    const convertCapacityToMwh = convertToPowerUnit({
      value: device.capacity,
      unit: EnergyUnit.kWh,
      targetUnit: EnergyUnit.MWh,
    });
    return {
      deviceType: `/device_types/${device.deviceTypeCode}`,
      fuel: `/fuels/${device.fuelCode}`,
      device: `/devices/${device.evidentDeviceId}`,
      registrant: `/organisations/${registrantId}`,
      name: device.projectName,
      capacity: convertCapacityToMwh.toString(),
      supported: true,
      latitude: device.latitude,
      longitude: device.longitude,
      registrationDate: new Date(device.createdAt).toISOString().split('T')[0],
      commissioningDate: device.commissioningDate.split('T')[0],
      status: EvidentRegistrationStatus.Draft,
      active: true,
      address1: device.address,
      country: `/countries/${alpha2CountryCode}`,
      notes: this.getNotes(device),
      issuer: `/organisations/${this.issuerId}`,
    };
  }

  private generateDeviceDetailsPayload(
    device: Device,
    registrantId: string,
    files?: string[],
  ): any {
    const alpha2CountryCode = findCountryByCode(device.countryCode).alpha2;
    const convertCapacityToMwh = convertToPowerUnit({
      value: device.capacity,
      unit: EnergyUnit.kWh,
      targetUnit: EnergyUnit.MWh,
    });
    return {
      deviceType: `/device_types/${device.deviceTypeCode}`,
      fuel: `/fuels/${device.fuelCode}`,
      device: `/devices/${device.evidentDeviceId}`,
      registrant: `/organisations/${registrantId}`,
      name: device.projectName,
      capacity: convertCapacityToMwh.toString(),
      supported: true,
      latitude: device.latitude,
      longitude: device.longitude,
      registrationDate: new Date(device.createdAt).toISOString().split('T')[0],
      commissioningDate: device.commissioningDate.split('T')[0],
      status: EvidentRegistrationStatus.Draft,
      active: true,
      address1: device.address,
      postcode: device.postcode,
      stateProvince: device.stateProvince,
      country: `/countries/${alpha2CountryCode}`,
      notes: this.getNotes(device),
      files: files || [],
    };
  }

  private getNotes(device: Device): string {
    return JSON.stringify({ 'D-REC ID': device.externalId });
  }

  async getStatus(organizationId: number, code: string): Promise<string> {
    const evidentInstance =
      await this.evidentService.getApiInstance(organizationId);
    const response = await evidentInstance.get(`/devices/${code}`);
    return response.data.latestDeviceDetails.status;
  }

  private async getIssuerForDevice(device: Device): Promise<string> {
    const country = findCountryByCode(device.countryCode).country;
    const issuer = await this.evidentService.getIssuerByCountry(
      device.organizationId,
      country,
    );

    if (issuer.data['hydra:member'].length > 0) {
      return issuer.data['hydra:member'][0]['@id'];
    }

    return null;
  }

  private async sendEvidentEmail(
    organization: Organization,
    device: Device,
    evidentStatus: EvidentRegistrationStatus,
  ) {
    if (evidentStatus === EvidentRegistrationStatus.Draft) {
      await this.mailService.send({
        to: organization.orgEmail,
        subject: getEvidentDraftDeviceRegistrationSubject(device),
        template: EvidentDraftDeviceRegistrationTemplate({
          device,
          organizationName: organization.name,
        }),
      });
    } else {
      await this.mailService.send({
        to: organization.orgEmail,
        subject: getEvidentSubmittedDeviceRegistrationSubject(device),
        template: EvidentSubmittedDeviceRegistrationTemplate({
          device,
          organizationName: organization.name,
        }),
      });
    }
  }

  private async updateEvidentStatus(
    device: Device,
    status: string,
  ): Promise<void> {
    await this.deviceService.updateEvidentInfo(
      device.externalId,
      device.evidentDeviceId,
      status as EvidentRegistrationStatus,
    );
  }

  // private async updateDeviceGroupStatus(device: Device) {
  //
  // }
}
