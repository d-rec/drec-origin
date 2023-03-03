import { Injectable, NotFoundException, Logger, Inject } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  CertificateService,
  CERTIFICATE_SERVICE_TOKEN,
  IIssueCommandParams,
  IIssuedCertificate,
  ITransferCommand,
} from '@energyweb/origin-247-certificate';
import { ICertificateMetadata } from '../../utils/types';
import { DateTime } from 'luxon';
import {
  FilterDTO,
  ReadsService as BaseReadsService,
} from '@energyweb/energy-api-influxdb';


import { HttpService } from '@nestjs/axios';

import { DeviceService } from '../device/device.service';
import { BASE_READ_SERVICE } from '../reads/const';
import { OrganizationService } from '../organization/organization.service';
import { DeviceGroupService } from '../device-group/device-group.service';
import { IDevice, BuyerReservationCertificateGenerationFrequency } from '../../models';
import { DeviceGroup } from '../device-group/device-group.entity';
import { DeviceGroupNextIssueCertificate } from '../device-group/device_group_issuecertificate.entity'
import { AnyARecord } from 'dns';
import { EndReservationdateDTO } from '../device-group/dto';
import { CertificateType, ReadType, SingleDeviceIssuanceStatus, StandardCompliance } from '../../utils/enums'
import { CheckCertificateIssueDateLogForDeviceEntity } from '../device/check_certificate_issue_date_log_for_device.entity'
import { CheckCertificateIssueDateLogForDeviceGroupEntity } from '../device-group/check_certificate_issue_date_log_for_device_group.entity'
import { HistoryDeviceGroupNextIssueCertificate } from '../device-group/history_next_issuance_date_log.entity'
import { ReadsService } from '../reads/reads.service'
import { HistoryIntermediate_MeterRead } from '../reads/history_intermideate_meterread.entity';
import { Device } from '../device';


@Injectable()
export class IssuerService {
  private readonly logger = new Logger(IssuerService.name);

  constructor(
    private groupService: DeviceGroupService,
    private deviceService: DeviceService,
    private organizationService: OrganizationService,
    private readservice: ReadsService,
    @Inject(CERTIFICATE_SERVICE_TOKEN)
    private readonly certificateService: CertificateService<ICertificateMetadata>,
    @Inject(BASE_READ_SERVICE)
    private baseReadsService: BaseReadsService,
    private httpService: HttpService
  ) { }

  // @Cron(CronExpression.EVERY_30_SECONDS)
  // @Cron('0 00 21 * * *') // Every day at 23:30 - Server Time
  // async handleCron(): Promise<void> {
  //   this.logger.debug('Called every day at 23:30 Server time');

  //   const startDate = DateTime.now().minus({ days: 1 }).toUTC();
  //   const endDate = DateTime.now().minus({ minute: 1 }).toUTC();

  //   this.logger.debug(`Start date ${startDate} - End date ${endDate}`);

  //   const groups = await this.groupService.getAll();
  //   await Promise.all(
  //     groups.map(async (group: DeviceGroup) => {


  //       group.devices = await this.deviceService.findForGroup(group.id);
  //       const organization = await this.organizationService.findOne(
  //         group.organizationId,
  //       );
  //       group.organization = {
  //         name: organization.name,
  //         blockchainAccountAddress: organization.blockchainAccountAddress,
  //       };
  //       return await this.issueCertificateForGroup(group, startDate, endDate);
  //     }),
  //   );
  // }
  //@Cron('0 00 21 * * *')

  //@Cron(CronExpression.EVERY_30_SECONDS)
  //@Cron('0 59 * * * *')
  //@Cron('0 */10 * * * *')
  // @Cron(CronExpression.EVERY_30_SECONDS)
  hitTheCronFromIssuerAPIOngoing() {
    // console.log("hitting issuer api");
    this.httpService.get(`${process.env.REACT_APP_BACKEND_URL}/api/drec-issuer/ongoing`).subscribe(response => {
      // console.log("came here",response)
    });
  }


  //@Cron('0 59 * * * *')
  //@Cron('0 */10 * * * *')
  // @Cron(CronExpression.EVERY_30_SECONDS)
  hitTheCronFromIssuerAPIHistory() {
    // console.log("hitting issuer api");
    this.httpService.get(`${process.env.REACT_APP_BACKEND_URL}/api/drec-issuer/history`).subscribe(response => {
      // console.log("came here",response)
    });
  }

  @Cron(CronExpression.EVERY_30_SECONDS)
  async handleCron(): Promise<void> {
    this.logger.debug('Called every 10 minutes to check for isssuance of certificates');

    const startDate1 = DateTime.now().minus({ days: 1 }).toUTC();
    const endDate1 = DateTime.now().minus({ minute: 1 }).toUTC();

    this.logger.debug(`Start date ${startDate1} - End date ${endDate1}`);

    const groupsrequestall = await this.groupService.getAllNextrequestCertificate();
    //this.logger.debug("groupsrequestall",groupsrequestall);
    await Promise.all(
      groupsrequestall.map(async (grouprequest: DeviceGroupNextIssueCertificate) => {
        const group = await this.groupService.findOne(
          { id: grouprequest.groupId }
        );
        if (!group) {
          console.error("group is missing", grouprequest.groupId);
          return;//if group is missing
        }
        if (group.leftoverReadsByCountryCode === null || group.leftoverReadsByCountryCode === undefined || group.leftoverReadsByCountryCode === '') {
          group.leftoverReadsByCountryCode = {};
        }
        if (typeof group.leftoverReadsByCountryCode === 'string') {
          group.leftoverReadsByCountryCode = JSON.parse(group.leftoverReadsByCountryCode);
        }
        var countryDevicegroup = await this.deviceService.NewfindForGroup(group.id, grouprequest.end_date);
        const organization = await this.organizationService.findOne(
          group.organizationId,
        );
        group.organization = {
          name: organization.name,
          blockchainAccountAddress: organization.blockchainAccountAddress,
        };
        const startDate = DateTime.fromISO(grouprequest.start_date).toUTC();
        const endDate = DateTime.fromISO(grouprequest.end_date).toUTC();
        let start_date = endDate.toString();

        let hours = 1;
        const frequency = group.frequency.toLowerCase();
        if (frequency === BuyerReservationCertificateGenerationFrequency.daily) {
          hours = 1 * 24;
        } else if (frequency === BuyerReservationCertificateGenerationFrequency.monhtly) {
          hours = 30 * 24;
        } else if (frequency === BuyerReservationCertificateGenerationFrequency.weekly) {
          hours = 7 * 24;
        } else if (frequency === BuyerReservationCertificateGenerationFrequency.quarterly) {
          hours = 91 * 24;
        }
        let end_date = new Date((new Date(new Date(endDate.toString())).getTime() + (hours * 3.6e+6))).toISOString()
        let newEndDate: string = '';
        let skipUpdatingNextIssuanceLogTable: boolean = false;
        if (new Date(endDate.toString()).getTime() === group.reservationEndDate.getTime()) {
          skipUpdatingNextIssuanceLogTable = true;
          console.log("end time reached for buyer reservation", group);
          let endDto = new EndReservationdateDTO();
          endDto.endresavationdate = new Date(group.reservationEndDate);
          await this.groupService.EndReservationGroup(group.id, group.organizationId, endDto, group, grouprequest);
        }
        if (!skipUpdatingNextIssuanceLogTable) {
          if (new Date(end_date).getTime() < group.reservationEndDate.getTime()) {
            newEndDate = end_date;
          }
          else {
            newEndDate = group.reservationEndDate.toISOString();
          }
          let allDevicesOfGroup: Device[] = await this.deviceService.findForGroup(group.id);

          try {
            //https://stackoverflow.com/a/10124053
            allDevicesOfGroup.sort(function (a, b) {
              // Turn your strings into dates, and then subtract them
              // to get a value that is either negative, positive, or zero.
              //@ts-ignore
              return new Date(b.createdAt) - new Date(a.createdAt);
            })

            let deviceOnBoardedWhichIsInBetweenNextIssuance: Device = allDevicesOfGroup.find(ele => {
              //returns first find which is minimum and between next frequency 
              if (new Date(ele.createdAt).getTime() > new Date(start_date).getTime() && new Date(ele.createdAt).getTime() < new Date(newEndDate).getTime()) {
                return true;
              }
            })
            if (deviceOnBoardedWhichIsInBetweenNextIssuance) {
              newEndDate = new Date(deviceOnBoardedWhichIsInBetweenNextIssuance.createdAt).toISOString();
            }
          }
          catch (e) {
            console.error("exception caught in inbetween device onboarding checking for createdAt");
            console.error(e);
          }
          await this.groupService.updatecertificateissuedate(grouprequest.id, start_date, newEndDate);
        }

        this.logger.debug(`Start date ${startDate} - End date ${endDate}`);
        for (let key in countryDevicegroup) {
          //deep clone to avoid duplicates
          let newGroup: DeviceGroup = JSON.parse(JSON.stringify(group));
          newGroup.devices = countryDevicegroup[key];
          this.newissueCertificateForGroup(newGroup, grouprequest, startDate, endDate, key);
        }
      }),
    );
  }

  // private groupBy(array: any, key: any): Promise<{ [key: string]: Device[] }> {
  //   console.log(array)

  //   return array.reduce((result: any, currentValue: any) => {

  //     (result[currentValue[key]] = result[currentValue[key]] || []).push(
  //       currentValue
  //     );

  //     return result;
  //   }, {});
  // };



  @Cron(CronExpression.EVERY_30_SECONDS)
  async handleCronForHistoricalIssuance(): Promise<void> {
    const historydevicerequestall = await this.groupService.getNextHistoryissuanceDevicelog();
    console.log(historydevicerequestall);
    await Promise.all(
      historydevicerequestall.map(async (historydevice: HistoryDeviceGroupNextIssueCertificate, historydevicerequestindex: number) => {

        const group = await this.groupService.findOne(
          { id: historydevice.groupId }
        );
        if (!group) {
          console.error("group is missing", historydevice.groupId);
          return;//if group is missing
        }

        const organization = await this.organizationService.findOne(
          group.organizationId,
        );
        group.organization = {
          name: organization.name,
          blockchainAccountAddress: organization.blockchainAccountAddress,
        };
        const Histroryread = await this.readservice.getCheckHistoryCertificateIssueDateLogForDevice(
          historydevice.device_externalid,
          historydevice.reservationStartDate,
          historydevice.reservationEndDate

        );
        if (!Histroryread?.length) {
          return;
        }
        const device = await this.deviceService.findReads(
          historydevice.device_externalid
        );
        await Promise.all(
          Histroryread.map(async (historydeviceread: HistoryIntermediate_MeterRead) => {
            this.newHistoryissueCertificateForDevice(group, historydeviceread, device);
          }),
        );

        let totalhistoryreadforsingledevices = 0;
        Histroryread.forEach((historydeviceread: HistoryIntermediate_MeterRead) => {
          if (
            !group.buyerAddress ||
            !group.buyerId
          ) {
            return;
          }
          // minimum value of certificate should be 1 Kw =1000W.
          if (historydeviceread.readsvalue < 1000) {
            return;
          }
          totalhistoryreadforsingledevices = totalhistoryreadforsingledevices + historydeviceread.readsvalue;
        });
        let totalReadValueMegaWattHour = totalhistoryreadforsingledevices / 10 ** 6;

        if (totalReadValueMegaWattHour != 0) {
          setTimeout(() => {
            this.groupService.updateTotalReadingRequestedForCertificateIssuance(group.id, group.organizationId, totalReadValueMegaWattHour);
          }, 1000 * (historydevicerequestindex + 1));

        }
        await this.groupService.HistoryUpdatecertificateissuedate(historydevice.id);

        if (group.reservationEndDate.getTime() <= new Date(device.createdAt).getTime()) {
          await this.deviceService.removeFromGroup(device.id, group.id);
        }

      }),
    )
  }



  private async issueCertificateForGroup(
    group: DeviceGroup,
    startDate: DateTime,
    endDate: DateTime,
  ): Promise<void> {
    const readsFilter: FilterDTO = {
      offset: 0,
      limit: 1000,
      start: startDate.toString(),
      end: endDate.toString(),
    };

    if (!group?.devices?.length) {
      return;
    }
    const org = await this.organizationService.findOne(group.organizationId);
    if (!org) {
      throw new NotFoundException(
        `No organization found with code ${group.organizationId}`,
      );
    }
    const groupReads: number[] = [];
    await Promise.all(
      group.devices.map(async (device: IDevice) =>
        groupReads.push(
          await this.getDeviceFullReads(device.externalId, readsFilter),
        ),
      ),
    );
    const totalReadValue = groupReads.reduce(
      (accumulator, currentValue) => accumulator + currentValue,
      0,
    );

    if (!totalReadValue) {
      return;
    }

    const totalReadValueKw = await this.handleLeftoverReads(
      group,
      totalReadValue,
    );

    if (!totalReadValueKw) {
      return;
    }

    const issueTotalReadValue = totalReadValueKw * 10 ** 3; // Issue certificate in watts

    const deviceGroup = {
      ...group,
      devices: [],
    };
    const issuance: IIssueCommandParams<ICertificateMetadata> = {
      deviceId: group.id?.toString(), // This is the device group id not a device id
      energyValue: issueTotalReadValue.toString(),
      fromTime: new Date(startDate.toString()),
      toTime: new Date(endDate.toString()),
      toAddress: org.blockchainAccountAddress,
      userId: org.blockchainAccountAddress,
      metadata: {
        version: "v1.0",
        buyerReservationId: group.devicegroup_uid,
        deviceIds: group.devices.map((device: IDevice) => device.id),
        //deviceGroup,
        groupId: group.id?.toString() || null,
      },
    };
    this.logger.log(
      `Issuance: ${JSON.stringify(issuance)}, Group name: ${group.name}`,
    );
    //const issuedCertificate = await 
    this.issueCertificate(issuance);
    //await this.transferCertificateToBuyer(group, issuedCertificate);
    return;
  }
  private async newissueCertificateForGroup(
    group: DeviceGroup,
    grouprequest: DeviceGroupNextIssueCertificate,
    startDate: DateTime,
    endDate: DateTime,
    countryCodeKey: string
  ): Promise<void> {
    console.log("DeviceGroupNextIssueCertificate");
    console.log(grouprequest);
    if (!group?.devices?.length) {
      return;
    }
    const org = await this.organizationService.findOne(group.organizationId);
    if (!org) {
      throw new NotFoundException(
        `No organization found with code ${group.organizationId}`,
      );
    }
    const groupReads: number[] = [];
    let allDevicesCompleteReadsBetweenTimeRange: Array<Array<{ timestamp: Date, value: number }>> = [];
    let filteredDevicesIndexesListIfMeterReadsNotAvailable: Array<number> = [];
    /*Get all devices meter reads between time range */
    /*https://stackoverflow.com/questions/37576685/using-async-await-with-a-foreach-loop refer to answer why map and async works */
    await Promise.all(
      group.devices.map(async (device: IDevice, index: number) => {
        /*
         day: 24 hours entries if hourly data  is sent , implies max entries 24 for one device
         30 days issuance : max entrries 30*24 = 720
        quarterly: issuance : max entrries  3 months: 31*3*24 = 2232
        so limit 5000 is kept to be on safer side
         */

        const readsFilter: FilterDTO = {
          offset: 0,
          limit: 5000,
          start: startDate.toString(),
          end: endDate.toString(),
        };
        let allReadsForDeviceBetweenTimeRange: Array<{ timestamp: Date, value: number }> = await this.getDeviceFullReadsWithTimestampAndValueAsArray(device.externalId, readsFilter);
        if (device.meterReadtype === 'Delta') {
          const FirstDeltaRead = await this.readservice.getDeltaMeterReadsFirstEntryOfDevice(device.externalId)

          allReadsForDeviceBetweenTimeRange = allReadsForDeviceBetweenTimeRange.filter(v => !(
            FirstDeltaRead.some(e => e.readsEndDate.getTime() === v.timestamp.getTime())))
        }

        console.log(startDate.toString())
        console.log("400")
        console.log(endDate.toString())
        const certifieddevices = await this.deviceService.getCheckCertificateIssueDateLogForDevice(device.externalId, new Date(startDate.toString()), new Date(endDate.toString()));
        console.log("certifieddevices");
        console.log(certifieddevices);
        console.log("beforeallReadsForDeviceBetweenTimeRange");
        console.log(allReadsForDeviceBetweenTimeRange);
        if (certifieddevices.length > 0) {

          allReadsForDeviceBetweenTimeRange = allReadsForDeviceBetweenTimeRange.filter(ele => {

            let readingInBetween: boolean = false;
            certifieddevices.forEach(certifieddevicesEle => {
              if (ele.timestamp.getTime() >= new Date(certifieddevicesEle.certificate_issuance_startdate).getTime() && ele.timestamp.getTime() <= new Date(certifieddevicesEle.certificate_issuance_enddate).getTime()) {
                readingInBetween = true;
              }
            });
            if (readingInBetween) {
              return false;
            }
            else {
              return true;
            }

          });
        }

        console.log("afterallReadsForDeviceBetweenTimeRange");
        console.log(allReadsForDeviceBetweenTimeRange);
        allDevicesCompleteReadsBetweenTimeRange[index] = allReadsForDeviceBetweenTimeRange;
        let devciereadvalue = allReadsForDeviceBetweenTimeRange.reduce(
          (accumulator, currentValue) => accumulator + currentValue.value,
          0,
        );
        if (devciereadvalue === 0) {
          filteredDevicesIndexesListIfMeterReadsNotAvailable.push(index);
        }
        groupReads[index] = devciereadvalue;
      }),
    );

    if (filteredDevicesIndexesListIfMeterReadsNotAvailable.length > 0) {
      filteredDevicesIndexesListIfMeterReadsNotAvailable.forEach(index => {
        group.devices.splice(index, 1);
        allDevicesCompleteReadsBetweenTimeRange.splice(index, 1);
        groupReads.splice(index, 1);
      })
    }

    if (group.devices.length === 0) {
      //after filtering if devices are not there then do not continue further 
      return;
    }
    const totalReadValue = groupReads.reduce(
      (accumulator, currentValue) => accumulator + currentValue,
      0,
    );

    if (!totalReadValue) {
      return;
    }
    const totalReadValueKw = await this.handleLeftoverReadsByCountryCode(
      group,
      totalReadValue,
      countryCodeKey
    );

    if (!totalReadValueKw) {
      return;
    }
    const issueTotalReadValue = totalReadValueKw * 10 ** 3; // Issue certificate in watts
    const deviceGroup = {
      ...group,
      devices: [],
    };
    if (

      !group.buyerAddress ||
      !group.buyerId
    ) {
      return;
    }
    let allPreviousReadingsOfDevices: Array<{ timestamp: Date, value: number }> = [];

    await Promise.all(
      group.devices.map(async (device: IDevice, index) => {
        console.log("came inside previous readings check");
        let previousReading: Array<{ timestamp: Date, value: number }> = [];
        if (allDevicesCompleteReadsBetweenTimeRange[index].length > 0) {
          let endTimestampToCheck = new Date(allDevicesCompleteReadsBetweenTimeRange[index][0].timestamp.getTime() - 1);
          let startTimeToCheck = device.createdAt;
          previousReading = await this.readservice.findLastReadForMeterWithinRange(device.externalId, new Date(startTimeToCheck), endTimestampToCheck);
          console.log("device previous reading", device.externalId, previousReading);
          console.log("device.meterReadtype", device.meterReadtype);
          if (previousReading.length == 0) {
            if (device.meterReadtype === ReadType.Delta) {
              previousReading = [{ timestamp: new Date(device.createdAt), value: 0 }];
            }
            else if (device.meterReadtype === ReadType.ReadMeter) {
              try {
                let aggregateReadings = await this.readservice.getAggregateMeterReadsFirstEntryOfDevice(device.externalId);
                if (aggregateReadings.length > 0) {
                  console.log("aggregateReadings[0].datetime", aggregateReadings[0].datetime);

                  previousReading = [{ timestamp: new Date(aggregateReadings[0].datetime), value: 0 }];
                }
                console.log("aggregateReadings", aggregateReadings);
              }
              catch (e) {
                console.error("error in getting aggregate read", e);
              }

            }
            console.log("device previous reading", device.externalId, previousReading);
          }

          //change this to when was initial reading came for aggregate or else if delta then its the createdAt
          if (previousReading.length > 0) {
            allPreviousReadingsOfDevices[index] = previousReading[0];
          }

        }
        let devciereadvalue = allDevicesCompleteReadsBetweenTimeRange[index].reduce(
          (accumulator, currentValue) => accumulator + currentValue.value,
          0,
        );
        console.log("previousReading", previousReading);
        console.log("allDevicesCompleteReadsBetweenTimeRange", allDevicesCompleteReadsBetweenTimeRange);
        let devicecertificatelogDto = new CheckCertificateIssueDateLogForDeviceEntity();
        devicecertificatelogDto.deviceid = device.externalId,
          devicecertificatelogDto.certificate_issuance_startdate = previousReading.length > 0 ? previousReading[0].timestamp : new Date(startDate.toString()),
          devicecertificatelogDto.certificate_issuance_enddate = allDevicesCompleteReadsBetweenTimeRange[index][allDevicesCompleteReadsBetweenTimeRange[index].length - 1].timestamp,// new Date(endDate.toString()),
          devicecertificatelogDto.status = SingleDeviceIssuanceStatus.Requested,
          devicecertificatelogDto.readvalue_watthour = devciereadvalue;
        devicecertificatelogDto.groupId = group.id;
        console.log("devicecertificatelogDto", devicecertificatelogDto);
        await this.deviceService.AddCertificateIssueDateLogForDevice(devicecertificatelogDto);
      }),
    );
    //find the minimum of all previous reading dates of devices  and use it as start date 
    let minimumStartDate: Date = new Date('1970-04-01T12:51:51.112Z');
    let checkMinimumStartDate: Date = new Date('1970-04-01T12:51:51.112Z');
    if (allPreviousReadingsOfDevices.length == 1) {
      minimumStartDate = allPreviousReadingsOfDevices[0].timestamp;
    }
    if (allPreviousReadingsOfDevices.length > 1) {
      allPreviousReadingsOfDevices.sort(function (a, b) {
        //@ts-ignore
        return a.timestamp - b.timestamp;
      });
      minimumStartDate = allPreviousReadingsOfDevices[0].timestamp;
    }


    let maximumEndDate: Date = new Date('1990-04-01T12:51:51.112Z');
    let checkMaximumEndDate: Date = new Date('1990-04-01T12:51:51.112Z');

    if (allDevicesCompleteReadsBetweenTimeRange.length == 1) {
      maximumEndDate = allDevicesCompleteReadsBetweenTimeRange[0][allDevicesCompleteReadsBetweenTimeRange[0].length - 1].timestamp;
    }
    else if (allDevicesCompleteReadsBetweenTimeRange.length > 1) {
      allDevicesCompleteReadsBetweenTimeRange.forEach(ele => {
        if (ele.length > 0)//if there are readings take last index reading as its the earliest date 
        {
          if (ele[ele.length - 1].timestamp.getTime() > maximumEndDate.getTime()) {
            maximumEndDate = ele[ele.length - 1].timestamp;
          }
        }

      })
    }

    const issuance: IIssueCommandParams<ICertificateMetadata> = {
      deviceId: group.id?.toString(), // This is the device group id not a device id
      energyValue: issueTotalReadValue.toString(),
      fromTime: minimumStartDate,//new Date(startDate.toString()),
      toTime: maximumEndDate,//new Date(endDate.toString()),
      toAddress: group.buyerAddress,
      userId: group.buyerAddress,
      metadata: {
        version: "v1.0",
        buyerReservationId: group.devicegroup_uid,
        isStandardIssuanceRequested: StandardCompliance.IREC,
        type: CertificateType.REC,
        deviceIds: group.devices.map((device: IDevice) => device.id),
        //deviceGroup,
        groupId: group.id?.toString() || null,
      },
    };
    this.logger.log(
      `Issuance: ${JSON.stringify(issuance)}, Group name: ${group.name}`,
    );
    let totalReadValueMegaWattHour = totalReadValueKw / 10 ** 3;
    this.groupService.updateTotalReadingRequestedForCertificateIssuance(group.id, group.organizationId, totalReadValueMegaWattHour);
    if (group.authorityToExceed === false && (group.targetVolumeCertificateGenerationRequestedInMegaWattHour + totalReadValueMegaWattHour) >= group.targetVolumeInMegaWattHour) {
      this.groupService.endReservationGroupIfTargetVolumeReached(group.id, group, grouprequest);
    }
    let devicegroupcertificatelogDto = new CheckCertificateIssueDateLogForDeviceGroupEntity();
    devicegroupcertificatelogDto.groupid = group.id?.toString(),
      devicegroupcertificatelogDto.certificate_issuance_startdate = minimumStartDate,//new Date(startDate.toString()),
      devicegroupcertificatelogDto.certificate_issuance_enddate = maximumEndDate,//new Date(endDate.toString()),
      devicegroupcertificatelogDto.status = SingleDeviceIssuanceStatus.Requested,
      devicegroupcertificatelogDto.readvalue_watthour = issueTotalReadValue,
      devicegroupcertificatelogDto.certificate_payload = issuance,
      devicegroupcertificatelogDto.countryCode = countryCodeKey;
    await this.groupService.AddCertificateIssueDateLogForDeviceGroup(devicegroupcertificatelogDto);
    //const issuedCertificate = await 
    this.issueCertificate(issuance);
    //console.log(issuedCertificate);
    console.log("generate Succesfull");
    return;
  }

  timerForHistoyIssuanceCounter: number = 0;


  private async newHistoryissueCertificateForDevice(
    group: DeviceGroup,
    devicehistoryrequest: HistoryIntermediate_MeterRead,
    device: IDevice
  ): Promise<void> {
    console.log("HistoryIntermediate_MeterRead");
    console.log(devicehistoryrequest);
    if (
      !group.buyerAddress ||
      !group.buyerId
    ) {
      return;
    }
    // minimum value of certificate should be 1 Kw =1000W.
    if (devicehistoryrequest.readsvalue < 1000) {
      return;
    }
    let devicecertificatelogDto = new CheckCertificateIssueDateLogForDeviceEntity();
    devicecertificatelogDto.deviceid = device.externalId,
      devicecertificatelogDto.certificate_issuance_startdate = new Date(devicehistoryrequest.readsStartDate.toString()),
      devicecertificatelogDto.certificate_issuance_enddate = new Date(devicehistoryrequest.readsEndDate.toString()),
      devicecertificatelogDto.status = SingleDeviceIssuanceStatus.Requested,
      devicecertificatelogDto.readvalue_watthour = devicehistoryrequest.readsvalue;
    devicecertificatelogDto.groupId = group.id;
    await this.deviceService.AddCertificateIssueDateLogForDevice(devicecertificatelogDto);
    const issuance: IIssueCommandParams<ICertificateMetadata> = {
      deviceId: group.id?.toString(), // This is the device group id not a device id
      energyValue: devicehistoryrequest.readsvalue.toString(),
      fromTime: new Date(devicehistoryrequest.readsStartDate.toString()),
      toTime: new Date(devicehistoryrequest.readsEndDate.toString()),
      toAddress: group.buyerAddress,
      userId: group.buyerAddress,
      metadata: {
        version: "v1.0",
        buyerReservationId: group.devicegroup_uid,
        isStandardIssuanceRequested: StandardCompliance.IREC,
        type: CertificateType.REC,
        deviceIds: [device.id],
        //deviceGroup,
        groupId: group.id?.toString() || null,
      },
    };
    this.logger.log(
      `Issuance: ${JSON.stringify(issuance)}, Group name: ${group.name}`,
    );
    // let totalReadValueMegaWattHour = devicehistoryrequest.readsvalue / 10 ** 6;
    // console.log("totalReadValueMegaWattHour");
    // console.log(totalReadValueMegaWattHour);
    // await this.groupService.updateTotalReadingRequestedForCertificateIssuance(group.id, group.organizationId, totalReadValueMegaWattHour);

    let devicegroupcertificatelogDto = new CheckCertificateIssueDateLogForDeviceGroupEntity();
    devicegroupcertificatelogDto.groupid = group.id?.toString(),
      devicegroupcertificatelogDto.certificate_issuance_startdate = new Date(devicehistoryrequest.readsStartDate.toString()),//new Date(startDate.toString()),
      devicegroupcertificatelogDto.certificate_issuance_enddate = new Date(devicehistoryrequest.readsEndDate.toString()),//new Date(endDate.toString()),
      devicegroupcertificatelogDto.status = SingleDeviceIssuanceStatus.Requested,
      devicegroupcertificatelogDto.readvalue_watthour = devicehistoryrequest.readsvalue,
      devicegroupcertificatelogDto.certificate_payload = issuance,
      devicegroupcertificatelogDto.countryCode = device.countryCode;
    await this.groupService.AddCertificateIssueDateLogForDeviceGroup(devicegroupcertificatelogDto);
    //const issuedCertificate = await 
    this.issueCertificate(issuance);

    console.log("generate Succesfull");
    await this.readservice.updatehistorycertificateissuedate(devicehistoryrequest.id, devicehistoryrequest.readsStartDate, devicehistoryrequest.readsEndDate);
    return;
  }

  private async transferCertificateToBuyer(
    group: DeviceGroup,
    certificate: IIssuedCertificate<ICertificateMetadata>,
  ) {
    if (
      !certificate ||
      !group.buyerAddress ||
      !group.buyerId ||
      !group.organization?.blockchainAccountAddress
    ) {
      return;
    }
    this.logger.log(`Transfering a certificate`);
    const transferCommand: ITransferCommand = {
      certificateId: certificate.id,
      fromAddress: group.organization.blockchainAccountAddress,
      toAddress: group.buyerAddress,
      energyValue: certificate.energy.publicVolume,
    };
    await this.certificateService.transfer(transferCommand);
  }

  private async handleLeftoverReadsByCountryCode(
    group: DeviceGroup,
    totalReadValueW: number,
    countryCodeKey: string
  ): Promise<number> {
    // Logic
    // 1. Get the accummulated read values from devices
    // 2. Transform current value from watts to kw
    // 3. Add any leftover value from group to the current total value
    // 4. Separate all decimal values from the curent kw value and store it as leftover value to the device group
    // 5. Return all the integer value from the current kw value (if any) and continue issuing the certificate

    const totalReadValueKw = group.leftoverReadsByCountryCode[countryCodeKey]
      ? totalReadValueW / 10 ** 3 + group.leftoverReadsByCountryCode[countryCodeKey]
      : totalReadValueW / 10 ** 3;
    const { integralVal, decimalVal } =
      this.separateIntegerAndDecimalByCountryCode(totalReadValueKw);
    await this.groupService.updateLeftOverReadByCountryCode(group.id, decimalVal, countryCodeKey);

    return integralVal;
  }

  private separateIntegerAndDecimalByCountryCode(num: number): {
    integralVal: number;
    decimalVal: number;
  } {
    if (!num) {
      return { integralVal: 0, decimalVal: 0 };
    }
    const integralVal = Math.floor(num);
    const decimalVal = this.roundDecimalNumberByCountryCode(num - integralVal);
    return { integralVal, decimalVal };
  }

  private roundDecimalNumberByCountryCode(num: number): number {
    if (num === 0) {
      return num;
    }
    const precision = 2;
    return Math.round(num * 10 ** precision) / 10 ** precision;
  }

  private async handleLeftoverReads(
    group: DeviceGroup,
    totalReadValueW: number,
  ): Promise<number> {
    // Logic
    // 1. Get the accummulated read values from devices
    // 2. Transform current value from watts to kw
    // 3. Add any leftover value from group to the current total value
    // 4. Separate all decimal values from the curent kw value and store it as leftover value to the device group
    // 5. Return all the integer value from the current kw value (if any) and continue issuing the certificate

    const totalReadValueKw = group.leftoverReads
      ? totalReadValueW / 10 ** 3 + group.leftoverReads
      : totalReadValueW / 10 ** 3;
    const { integralVal, decimalVal } =
      this.separateIntegerAndDecimal(totalReadValueKw);
    await this.groupService.updateLeftOverRead(group.id, decimalVal);

    return integralVal;
  }

  private separateIntegerAndDecimal(num: number): {
    integralVal: number;
    decimalVal: number;
  } {
    if (!num) {
      return { integralVal: 0, decimalVal: 0 };
    }
    const integralVal = Math.floor(num);
    const decimalVal = this.roundDecimalNumber(num - integralVal);
    return { integralVal, decimalVal };
  }

  private roundDecimalNumber(num: number): number {
    if (num === 0) {
      return num;
    }
    const precision = 2;
    return Math.round(num * 10 ** precision) / 10 ** precision;
  }

  private async getDeviceFullReadsWithTimestampAndValueAsArray(
    meterId: string,
    filter: FilterDTO,
  ): Promise<Array<{ timestamp: Date, value: number }>> {
    console.log("381")
    const allReads: Array<{ timestamp: Date, value: number }> = await this.baseReadsService.find(meterId, filter);
    console.log(`allReads externalId:${meterId}`, allReads);
    return allReads;
  }

  private async getDeviceFullReads(
    meterId: string,
    filter: FilterDTO,
  ): Promise<number> {
    console.log("381")
    const allReads = await this.baseReadsService.find(meterId, filter);
    console.log(`allReads externalId:${meterId}`, allReads);
    return allReads.reduce(
      (accumulator, currentValue) => accumulator + currentValue.value,
      0,
    );
  }

  // private async issueCertificate(
  //   reading: IIssueCommandParams<ICertificateMetadata>,
  // ): Promise<IIssuedCertificate<ICertificateMetadata>> {
  //   this.logger.log(`Issuing a certificate for reading`);
  //   const issuedCertificate = await this.certificateService.issue(reading);
  //   this.logger.log(`Issued a certificate with ID ${issuedCertificate.id}`);
  //   return issuedCertificate;
  // }

  //actual definition is up removing async

  issueCertificateFromAPI(reading: IIssueCommandParams<ICertificateMetadata>)
  {
    reading.fromTime = new Date(reading.fromTime);
    reading.toTime = new Date(reading.toTime);
    this.issueCertificate(reading);

  }

  private issueCertificate(
    reading: IIssueCommandParams<ICertificateMetadata>,
  ) {
    this.logger.log(`Issuing a certificate for reading`);
    this.certificateService.issue(reading);
  }



}
