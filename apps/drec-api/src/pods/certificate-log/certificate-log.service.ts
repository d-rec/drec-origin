import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { CheckCertificateIssueDateLogForDeviceEntity } from '../device/check_certificate_issue_date_log_for_device.entity';
import {
  getManager,
  Repository,
  IsNull,
  Not,
  Brackets,
  SelectQueryBuilder,
} from 'typeorm';
import { FilterDTO } from './dto/filter.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Device } from '../device/device.entity';
import { Certificate } from '@energyweb/issuer-api';
import { DeviceService } from '../device/device.service';
import {
  CertificateNewWithPerDeviceLog,
  CertificateWithPerdevicelog,
  CertificatelogResponse,
} from './dto';
import { DeviceGroupService } from '../device-group/device-group.service';
import { DeviceGroupDTO } from '../device-group/dto';
import {
  IGetAllCertificatesOptions,
  ICertificateReadModel,
} from '@energyweb/origin-247-certificate';
import { ICertificateMetadata } from '../../utils/types';
import { getLocalTimeZoneFromDevice } from '../../utils/localTimeDetailsForDevice';
import { CertificateReadModelEntity } from '@energyweb/origin-247-certificate/dist/js/src/offchain-certificate/repositories/CertificateReadModel/CertificateReadModel.entity';
import { DeviceGroup } from '../device-group/device-group.entity';
import { deviceFilterDTO } from './dto/deviceFilter.dto';
import { ILoggedInUser } from '../../models';
import { Role } from '../../utils/enums';
import { Response } from 'express';
import { parseMetadata } from '../../lib/helpers/parseMetadata';

export interface newCertificate extends Certificate {
  perDeviceCertificateLog: CheckCertificateIssueDateLogForDeviceEntity;
}

@Injectable()
export class CertificateLogService {
  private readonly logger = new Logger(CertificateLogService.name);

  constructor(
    @InjectRepository(CheckCertificateIssueDateLogForDeviceEntity)
    private readonly repository: Repository<CheckCertificateIssueDateLogForDeviceEntity>,
    @InjectRepository(Certificate)
    private readonly certificateRepository: Repository<Certificate>,
    @InjectRepository(CertificateReadModelEntity)
    private readonly certificateReadModuleRepository: Repository<
      CertificateReadModelEntity<ICertificateMetadata>
    >,
    private deviceService: DeviceService,
    private devicegroupService: DeviceGroupService,
  ) {}

  public async find(): Promise<CheckCertificateIssueDateLogForDeviceEntity[]> {
    this.logger.verbose(`With in find`);

    return this.repository.find();
  }

  public async findByGroupId(
    groupId: string,
  ): Promise<CheckCertificateIssueDateLogForDeviceEntity[]> {
    this.logger.verbose(`With in findByGroupId`);

    return this.repository.find({
      where: {
        groupId: Number(groupId),
      },
    });
  }

  async findCertificateLog(): Promise<
    CheckCertificateIssueDateLogForDeviceEntity[]
  > {
    this.logger.verbose(`With in findCertificateLog`);
    const totalNumbers: any = getManager()
      .createQueryBuilder()
      .select('d.externalId', 'externalId')
      .addSelect('(COUNT(dl.id))', 'total')
      .from(CheckCertificateIssueDateLogForDeviceEntity, 'dl')
      .leftJoin(Device, 'd', 'dl.externalId = d.externalId')
      .where('d.organizationId = :orgid', { orgid: 3 })
      .andWhere('dl.readvalue_watthour>0')
      .groupBy('d.externalId');
    const devicelog = await totalNumbers.getRawMany();

    return devicelog;
  }

  async getCertificateFromOldOrNew(
    groupid: string,
    pageNumber?: number,
  ): Promise<any> {
    this.logger.verbose(`With in getCertificateFromOldOrNew`);
    const page = pageNumber ? Number(pageNumber) : 1; // Specify the page number you want to retrieve
    const itemsPerPage = 20; // Specify the number of items per page

    const [certificates, totalCertificates] =
      await this.certificateRepository.findAndCount({
        where: {
          deviceId: groupid,
        },
        order: {
          createdAt: 'DESC',
        },
        skip: (page - 1) * itemsPerPage,
        take: itemsPerPage,
      });

    if (certificates.length > 0) {
      const logData =
        await this.findCertifiedReservations<CertificateWithPerdevicelog>(
          certificates,
          groupid,
        );
      return {
        certificatelog: logData,
        totalItems: totalCertificates,
        currentPage: page,
        totalPages: Math.ceil(totalCertificates / itemsPerPage),
      };
    }

    const certificateReads: ICertificateReadModel<ICertificateMetadata>[] =
      await this.certificateReadModuleRepository.find({
        where: {
          deviceId: groupid,
        },
        order: {
          createdAt: 'DESC',
        },
        skip: (page - 1) * itemsPerPage, // Calculate the number of items to skip based on the page number
        take: itemsPerPage, // Specify the number of items to take per page
      });

    if (!certificateReads?.length)
      return {
        certificatelog: [],
        totalItems: 0,
        currentPage: 0,
        totalPages: 0,
      };

    const totalCertificateReads =
      await this.certificateReadModuleRepository.count({
        where: {
          deviceId: groupid,
        },
      });

    const logData =
      await this.getCertificatesUsingGroupIDVersionUpdateOrigin247(
        certificateReads,
        groupid,
      );
    return {
      certificatelog: logData,
      totalItems: totalCertificateReads,
      currentPage: page,
      totalPages: Math.ceil(totalCertificateReads / itemsPerPage),
    };
  }

  async findCertifiedReservations<T>(
    certificates:
      | Certificate[]
      | ICertificateReadModel<ICertificateMetadata>[]
      | any,
    groupId: string,
    includeTransactionId = false,
  ): Promise<T[]> {
    this.logger.verbose(`With in findCertifiedReservations`);
    return await Promise.all(
      certificates.map(async (certificate: CertificateWithPerdevicelog) =>
        this.getCertifiedReservation(
          certificate,
          groupId,
          includeTransactionId,
        ),
      ),
    );
  }

  async getCertificatesUsingGroupIDVersionUpdateOrigin247(
    certifiedReservations: ICertificateReadModel<ICertificateMetadata>[] | any,
    groupId: string,
  ): Promise<CertificateNewWithPerDeviceLog[]> {
    this.logger.verbose(
      `With in getCertificatesUsingGroupIDVersionUpdateOrigin247`,
    );

    return await this.findCertifiedReservations<CertificateNewWithPerDeviceLog>(
      certifiedReservations,
      groupId,
      true,
    );
  }

  public async getCheckCertificateIssueDateLogForDevice(
    groupId: number,
    deviceId: string,
    startDate: Date,
    endDate: Date,
    certificateTransactionUID?: string,
  ): Promise<CheckCertificateIssueDateLogForDeviceEntity[]> {
    this.logger.verbose(`With in getCheckCertificateIssueDateLogForDevice`);
    try {
      let deviceLog;

      if (certificateTransactionUID) {
        deviceLog = await this.getDeviceLogFromTransactionUID(
          groupId,
          deviceId,
          certificateTransactionUID,
        );
        return deviceLog;
      } else {
        const query = this.getDeviceLogFilteredQueryWithGroupID(
          groupId,
          deviceId,
          startDate,
          endDate,
        );
        deviceLog = await query.getRawMany();
      }
      const reservedDevices = await deviceLog.map((s: any) => {
        const item: any = {
          id: s.issuelog_id,
          certificate_issuance_startdate:
            s.issuelog_certificate_issuance_startdate,
          certificate_issuance_enddate: s.issuelog_certificate_issuance_enddate,
          readvalue_watthour: s.issuelog_readvalue_watthour,
          status: s.issuelog_status,
          groupId: s.issuelog_groupId,
        };
        return item;
      });
      return reservedDevices;
    } catch (error) {
      this.logger.error(`Failed to retrieve device`, error.stack);
    }
  }

  private async getCertifiedReservation(
    certificate:
      | Certificate
      | ICertificateReadModel<ICertificateMetadata>
      | any,
    groupId: string,
    includeTransactionId = false,
  ) {
    const certificateStartDate = new Date(
      certificate.generationStartTime * 1000,
    ).toISOString();

    const certificateEndDate = new Date(
      certificate.generationEndTime * 1000,
    ).toISOString();

    const perDeviceCertificateLog = [];

    const metadata = parseMetadata(certificate.metadata);

    if (!metadata) return;

    const certificateTransactionUID = includeTransactionId
      ? metadata.certificateTransactionUID
      : undefined;

    const deviceReadStartDate = new Date(
      (certificate.generationStartTime - 1) * 1000,
    ); //as rounding when certificate is issued by EWFs package reference kept above and removing millseconds
    const deviceReadEndDate = new Date(
      (certificate.generationEndTime + 1) * 1000,
    ); //going back 1 second in start and going forward 1 second in end
    const logs = await this.getDeviceLogsPerCertificate(
      metadata.deviceIds,
      parseInt(groupId),
      deviceReadStartDate,
      deviceReadEndDate,
      certificateTransactionUID,
    );

    perDeviceCertificateLog.push(...logs);
    return {
      ...certificate,
      perDeviceCertificateLog,
      certificateStartDate,
      certificateEndDate,
    };
  }

  private async getDeviceLogsPerCertificate(
    deviceIds: (number | string)[],
    groupId: number,
    startDate: Date,
    endDate: Date,
    certificateTransactionUID?: string,
  ) {
    const logs = await Promise.all(
      deviceIds.map(async (deviceId: number | string) => {
        let device: Device;

        if (typeof deviceId === 'number') {
          device = await this.deviceService.findOne(deviceId);
        }

        if (typeof deviceId === 'string') {
          device = await this.deviceService.findReads(deviceId);
        }

        const deviceLogs = await this.getCheckCertificateIssueDateLogForDevice(
          groupId,
          device.externalId,
          startDate,
          endDate,
          certificateTransactionUID,
        );

        return deviceLogs.map((deviceLog) => {
          deviceLog.externalId = device.developerExternalId;
          deviceLog['timezone'] = getLocalTimeZoneFromDevice(
            device.createdAt,
            device,
          );
          return deviceLog;
        });
      }),
    );
    return logs.flat();
  }

  private getDeviceLogFilteredQueryWithGroupID(
    groupId: number,
    deviceId: string,
    startDate: Date,
    endDate: Date,
  ): SelectQueryBuilder<CheckCertificateIssueDateLogForDeviceEntity> {
    this.logger.verbose(`With in getDeviceLogFilteredQueryWithGroupID`);
    const query = this.repository
      .createQueryBuilder('issuelog')
      .where('issuelog.externalId = :deviceid', { deviceid: deviceId })
      .andWhere(
        new Brackets((db) => {
          db.where(
            new Brackets((db1) => {
              db1
                .where(
                  'issuelog.certificate_issuance_startdate BETWEEN :DeviceReadingStartDate1  AND :DeviceReadingEndDate1',
                  {
                    DeviceReadingStartDate1: startDate,
                    DeviceReadingEndDate1: endDate,
                  },
                )
                .orWhere(
                  'issuelog.certificate_issuance_startdate = :DeviceReadingStartDate',
                  { DeviceReadingStartDate: startDate },
                );
            }),
          ).andWhere(
            new Brackets((db2) => {
              db2
                .where(
                  'issuelog.certificate_issuance_enddate  BETWEEN :DeviceReadingStartDate2  AND :DeviceReadingEndDate2',
                  {
                    DeviceReadingStartDate2: startDate,
                    DeviceReadingEndDate2: endDate,
                  },
                )
                .orWhere(
                  'issuelog.certificate_issuance_enddate = :DeviceReadingEndDate ',
                  { DeviceReadingEndDate: endDate },
                );
            }),
          );
        }),
      )
      .andWhere('issuelog.groupId = :groupId', { groupId: groupId });
    return query;
  }

  private getDeviceLogFromTransactionUID(
    groupId: number,
    deviceId: string,
    certificateTransactionUID: string,
  ): Promise<CheckCertificateIssueDateLogForDeviceEntity[]> {
    this.logger.verbose(`With in getDeviceLogFromTransactionUID`);
    return this.repository.find({
      where: {
        groupId: groupId,
        externalId: deviceId,
        certificateTransactionUID: certificateTransactionUID,
      },
    });
  }

  async getCertificateForRedemptionReport(
    groupId: string,
  ): Promise<Certificate[]> {
    this.logger.verbose(`With in getCertificateForRedemptionReport`);
    const certifiedReservation = await this.certificateRepository.find({
      where: {
        deviceId: groupId,
        claims: Not(IsNull()),
      },
    });
    return certifiedReservation;
  }

  async getCertificateRedemptionReport(buyerId: number): Promise<any[]> {
    this.logger.verbose(`With in getCertificateRedemptionReport`);
    const deviceGroups =
      await this.devicegroupService.getBuyerDeviceGroups(buyerId);
    const redemptionReports = [];
    await Promise.all(
      deviceGroups.map(async (devicegroup: DeviceGroupDTO) => {
        const cert = await this.getCertificateForRedemptionReport(
          devicegroup.id.toString(),
        );
        await Promise.all(
          cert.map(async (claimcertificate: Certificate) => {
            await Promise.all(
              claimcertificate.claims.map(async (claims: any) => {
                redemptionReports.push({
                  compliance: 'I-REC',
                  certificateId: claimcertificate.id,
                  fuelCode: devicegroup?.fuelCode.toString().split(','),
                  country: devicegroup?.countryCode.toString().split(','),
                  capacityRange: devicegroup?.capacityRange,
                  offTakers: devicegroup?.offTakers
                    .join()
                    .replace(',', ' ,')
                    .toString()
                    .split(','),
                  commissioningDateRange: devicegroup?.commissioningDateRange
                    .join()
                    .replace(',', ', '),
                  redemptionDate: claims.claimData.periodStartDate.substring(
                    claims.claimData.periodStartDate.indexOf(':') + 1,
                  ),
                  certifiedEnergy: claims.value / 10 ** 6,
                  beneficiary: claims.claimData.beneficiary.substring(
                    claims.claimData.beneficiary.indexOf(':') + 1,
                  ),
                  beneficiary_address: claims.claimData.location.substring(
                    claims.claimData.location.indexOf(':') + 1,
                  ),
                  claimCoiuntryCode: claims.claimData.countryCode.substring(
                    claims.claimData.countryCode.indexOf(':') + 1,
                  ),
                  purpose: claims.claimData.purpose.substring(
                    claims.claimData.purpose.indexOf(':') + 1,
                  ),
                });
              }),
            );
          }),
        );
      }),
    );
    return redemptionReports;
  }

  //@Cron(CronExpression.EVERY_30_SECONDS)
  async getsCertificateReadModule(
    userOrgId: string,
    pageNumber: number,
    deviceFilter: deviceFilterDTO,
    generationStartTime?: string,
    generationEndTime?: string,
    targetVolumeCertificateGenerationRequestedInMegaWattHour?: number,
  ): Promise<{
    result: any[];
    pageNumber: number;
    totalPages: number;
    totalCount: number;
  }> {
    this.logger.verbose(`With in getsCertificateReadModule`);
    const pageSize = 3;

    if (pageNumber <= 0) {
      throw new HttpException('Invalid page number', HttpStatus.BAD_REQUEST);
    }

    const skip = (pageNumber - 1) * pageSize;

    let queryBuilder = this.certificateReadModuleRepository
      .createQueryBuilder('crm')
      .innerJoin(DeviceGroup, 'dg', 'crm.deviceId = dg.id::text')
      .andWhere('dg.organizationId = :userOrgId', { userOrgId })
      .skip(skip)
      .take(pageSize);
    if (generationStartTime && generationEndTime) {
      const startTimestamp = new Date(generationStartTime).getTime() / 1000;
      const endTimestamp = new Date(generationEndTime).getTime() / 1000;

      queryBuilder = queryBuilder
        .andWhere('crm.generationStartTime <= :endTimestamp', { endTimestamp })
        .andWhere('crm.generationEndTime >= :startTimestamp', {
          startTimestamp,
        });
    } else if (generationStartTime) {
      const startTimestamp = new Date(generationStartTime).getTime() / 1000;

      queryBuilder = queryBuilder.andWhere(
        'crm.generationStartTime <= :startTimestamp',
        { startTimestamp },
      );
    } else if (generationEndTime) {
      const endTimestamp = new Date(generationEndTime).getTime() / 1000;

      queryBuilder = queryBuilder.andWhere(
        'crm.generationEndTime >= :endTimestamp',
        { endTimestamp },
      );
    }

    if (
      targetVolumeCertificateGenerationRequestedInMegaWattHour !== undefined
    ) {
      queryBuilder = queryBuilder.andWhere(
        'dg.targetVolumeCertificateGenerationRequestedInMegaWattHour <= :targetVolume',
        {
          targetVolume:
            targetVolumeCertificateGenerationRequestedInMegaWattHour,
        },
      );
    }

    this.logger.debug('BEFORE QUERY:::::::::::::::::::::' + new Date());
    const results = await queryBuilder.getRawMany();
    const count = await queryBuilder.getCount();
    this.logger.debug('AFTER QUERY:::::::::::::::::::::' + new Date());

    const totalPages = Math.ceil(count / pageSize);

    if (pageNumber > totalPages) {
      throw new HttpException('Page number out of range', HttpStatus.NOT_FOUND);
    }

    const formattedResults = results.map((result) => {
      const parsedMetadata = JSON.parse(result.crm_metadata);
      return {
        ...result,
        crm_metadata: parsedMetadata,
      };
    });

    return {
      result: formattedResults,
      pageNumber: pageNumber,
      totalPages: totalPages,
      totalCount: count,
    };
  }

  // add function for check the last end certified log in active reservation time
  async getLastCertifiedDevicelogBYgroupId(
    groupId: number,
    deviceId: string,
  ): Promise<CheckCertificateIssueDateLogForDeviceEntity> {
    this.logger.verbose(`With in getLastCertifiedDevicelogBYgroupId`);
    return this.repository.findOne({
      where: {
        groupId: groupId,
        externalId: deviceId,
      },
      order: {
        certificate_issuance_enddate: 'DESC',
      },
    });
  }

  //add function to get the certified log which device of developer added in reservation for developer

  async getCertifiedlogofDevices(
    user: ILoggedInUser,
    filterDto: FilterDTO,
    pageNumber: number,
  ): Promise<{
    certificatelog:
      | CertificateNewWithPerDeviceLog[]
      | CertificateWithPerdevicelog[];
    currentpage?: number;
    totalPages: number;
    totalCount: number;
    oldcertificatelog: boolean;
  }> {
    this.logger.verbose(`With in getCertifiedlogofDevices`);
    const getnewreservationinfo =
      await this.devicegroupService.getReservationInforDeveloperBsise(
        user.organizationId,
        user.role,
        filterDto,
        pageNumber,
        user.api_user_id,
      );
    this.logger.debug(
      'getnewreservationinfo',
      getnewreservationinfo.deviceGroups.length,
    );
    const getoldreservationinfo =
      await this.devicegroupService.getoldReservationInforDeveloperBsise(
        user.organizationId,
        user.role,
        filterDto,
        pageNumber,
        user.api_user_id,
      );
    this.logger.debug(
      'getoldreservationinfo',
      getoldreservationinfo.deviceGroups.length,
    );
    const oldcertificatelog = this.isTrue(filterDto.oldcertificatelog);
    if (!oldcertificatelog && getnewreservationinfo.deviceGroups.length > 0) {
      this.logger.debug('Line No: 580');
      const newlog =
        await this.getDeveloperCertificatesUsingGroupIDVersionUpdateOrigin247(
          getnewreservationinfo,
          user.role,
        );

      return {
        ...newlog,
        oldcertificatelog:
          getoldreservationinfo.deviceGroups.length > 0 ? true : false,
      };
    }

    if (oldcertificatelog && getoldreservationinfo.deviceGroups.length > 0) {
      this.logger.debug('Line No: 581');
      const oldlog = await this.getDeveloperfindCertifiedReservations(
        getoldreservationinfo,
        user.role,
      );
      return {
        ...oldlog,
        oldcertificatelog:
          getoldreservationinfo.deviceGroups.length > 0 ? true : false,
      };
    }

    return {
      certificatelog: [],
      currentpage: 0,
      totalPages: 0,
      totalCount: 0,
      oldcertificatelog: false,
    };
  }

  isTrue(value: string | boolean): boolean {
    return value === 'true' || value === true;
  }

  async getDeveloperfindCertifiedReservations(
    certifiedReservation:
      | {
          deviceGroups: any;
          pageNumber: number;
          totalPages: number;
          totalCount: any;
        }
      | any,
    role: Role,
  ): Promise<CertificatelogResponse> {
    const finalcertificatesInReservationWithLog: Array<any> = [];
    this.logger.verbose(`With in getDeveloperfindCertifiedReservations`);
    await Promise.all(
      certifiedReservation.deviceGroups.map(async (group: any) => {
        const newq = await this.certificateRepository
          .createQueryBuilder('issuar')
          .where(
            `issuar.id IN (${JSON.stringify(group.internalCertificateId).replace(/[[\]]/g, '')})`,
          );

        const groupedDatasql = await newq.getQuery();
        this.logger.debug(groupedDatasql);
        const result = await newq.getMany();
        const res = await Promise.all(
          result.map(async (certifiedlist: CertificateWithPerdevicelog) => {
            certifiedlist.certificateStartDate = new Date(
              certifiedlist.generationStartTime * 1000,
            ).toISOString();
            certifiedlist.certificateEndDate = new Date(
              certifiedlist.generationEndTime * 1000,
            ).toISOString();
            certifiedlist.perDeviceCertificateLog = [];

            try {
              JSON.parse(certifiedlist.metadata);
            } catch (e) {
              this.logger.error(
                e,
                `certificate doesnt contains valid metadta ${certifiedlist}`,
              );
              return;
            }
            const obj = JSON.parse(certifiedlist.metadata);

            const devicereadstartdate = new Date(
              (certifiedlist.generationStartTime - 1) * 1000,
            ); //as rounding when certificate is issued by EWFs package reference kept above and removing millseconds
            const devicereadenddate = new Date(
              (certifiedlist.generationEndTime + 1) * 1000,
            ); //going back 1 second in start and going forward 1 second in end
            await Promise.all(
              obj.deviceIds.map(async (deviceid: number) => {
                // const device = await this.deviceService.findOne(deviceid);
                let device: Device;
                if (typeof deviceid === 'number') {
                  device = await this.deviceService.findOne(deviceid);
                }
                if (typeof deviceid === 'string') {
                  device = await this.deviceService.findReads(deviceid);
                }
                let devicelog;
                if (role === 'OrganizationAdmin') {
                  if (
                    group.developerdeviceIds.find((ele) => ele === deviceid)
                  ) {
                    this.logger.log('oldlog exist in developer');
                    const devicelog =
                      await this.getCheckCertificateIssueDateLogForDevice(
                        parseInt(group.dg_id),
                        device.externalId,
                        devicereadstartdate,
                        devicereadenddate,
                      );
                    devicelog.forEach((singleDeviceLogEle) => {
                      singleDeviceLogEle.externalId =
                        device.developerExternalId;
                      singleDeviceLogEle['deviceId'] = device.id;
                      singleDeviceLogEle['timezone'] =
                        getLocalTimeZoneFromDevice(device.createdAt, device);
                      certifiedlist.perDeviceCertificateLog.push(
                        singleDeviceLogEle,
                      );
                    });
                  } else {
                    this.logger.log("oldlog doesn't exist in developer");
                    const devicelog =
                      await this.getCheckCertificateIssueDateLogForDevice(
                        parseInt(group.dg_id),
                        device.externalId,
                        devicereadstartdate,
                        devicereadenddate,
                      );
                    if (devicelog.length > 0) {
                      const totalReadValue = devicelog.reduce(
                        (accumulator, currentValue) =>
                          accumulator + currentValue.readvalue_watthour,
                        0,
                      );
                      devicelog[0].readvalue_watthour = totalReadValue;
                      devicelog[0].externalId = 'Other Devices';
                      devicelog[0]['deviceId'] = 0;
                      devicelog['timezone'] = getLocalTimeZoneFromDevice(
                        device.createdAt,
                        device,
                      );
                      certifiedlist.perDeviceCertificateLog.push(devicelog[0]);
                    }
                  }
                }
                if (role === 'Buyer' || role === Role.ApiUser) {
                  devicelog =
                    await this.getCheckCertificateIssueDateLogForDevice(
                      parseInt(group.dg_id),
                      device.externalId,
                      devicereadstartdate,
                      devicereadenddate,
                    );
                  devicelog.forEach((singleDeviceLogEle) => {
                    singleDeviceLogEle.externalId = device.developerExternalId;
                    singleDeviceLogEle['deviceId'] = device.id;
                    singleDeviceLogEle['timezone'] = getLocalTimeZoneFromDevice(
                      device.createdAt,
                      device,
                    );
                    certifiedlist.perDeviceCertificateLog.push(
                      singleDeviceLogEle,
                    );
                  });
                }
              }),
            );
            finalcertificatesInReservationWithLog.push(certifiedlist);
            return certifiedlist;
          }),
        );

        return res;
      }),
    );
    const response = {
      certificatelog: finalcertificatesInReservationWithLog,
      currentpage: certifiedReservation.pageNumber,
      totalPages: certifiedReservation.totalPages,
      totalCount: certifiedReservation.totalCount,
    };
    return response;
  }

  async getDeveloperCertificatesUsingGroupIDVersionUpdateOrigin247(
    reservationInfo:
      | {
          deviceGroups: any;
          pageNumber: number;
          totalPages: number;
          totalCount: any;
        }
      | any,
    role: Role,
  ): Promise<CertificatelogResponse> {
    this.logger.verbose(
      `With in getDeveloperCertificatesUsingGroupIDVersionUpdateOrigin247`,
    );
    const finalcertificatesInReservationWithLog: Array<any> = [];
    await Promise.all(
      reservationInfo.deviceGroups.map(async (group: any) => {
        const newq = await this.certificateReadModuleRepository
          .createQueryBuilder('crm')
          .where(
            `crm.internalCertificateId IN (${JSON.stringify(group.internalCertificateId).replace(/[[\]]/g, '')})`,
          );
        const groupedDatasql = await newq.getQuery();
        this.logger.debug(groupedDatasql);
        const result = await newq.getMany();
        const certificatesInReservationWithLog: Array<CertificateNewWithPerDeviceLog> =
          [];
        result.forEach((ele) =>
          certificatesInReservationWithLog.push({
            ...ele,
            perDeviceCertificateLog: [],
            certificateStartDate: '',
            certificateEndDate: '',
          }),
        );
        await Promise.all(
          result.map(
            async (
              certifiedlist: ICertificateReadModel<ICertificateMetadata>,
              index: number,
            ) => {
              certificatesInReservationWithLog[index].certificateStartDate =
                new Date(
                  certifiedlist.generationStartTime * 1000,
                ).toISOString();
              certificatesInReservationWithLog[index].certificateEndDate =
                new Date(certifiedlist.generationEndTime * 1000).toISOString();
              certificatesInReservationWithLog[index].perDeviceCertificateLog =
                [];
              try {
                if (typeof certifiedlist.metadata === 'string') {
                  JSON.parse(certifiedlist.metadata);
                }
              } catch (e) {
                this.logger.error(
                  e,
                  `certificate doesnt contains valid metadata ${certifiedlist}`,
                );
                return;
              }

              let obj;
              if (typeof certifiedlist.metadata === 'string') {
                obj = JSON.parse(certifiedlist.metadata);
              } else {
                obj = certifiedlist.metadata;
              }
              const certificateTransactionUID = obj.certificateTransactionUID;
              const devicereadstartdate = new Date(
                (certifiedlist.generationStartTime - 1) * 1000,
              ); //as rounding when certificate is issued by EWFs package reference kept above and removing millseconds
              const devicereadenddate = new Date(
                (certifiedlist.generationEndTime + 1) * 1000,
              ); //going back 1 second in start and going forward 1 second in end
              await Promise.all(
                obj.deviceIds.map(async (deviceid: number) => {
                  let device: Device;
                  if (typeof deviceid === 'number') {
                    device = await this.deviceService.findOne(deviceid);
                  }
                  if (typeof deviceid === 'string') {
                    device = await this.deviceService.findReads(deviceid);
                  }
                  let devicelog;
                  if (role === 'OrganizationAdmin') {
                    if (
                      group.developerdeviceIds.find((ele) => ele === device.id)
                    ) {
                      devicelog =
                        await this.getCheckCertificateIssueDateLogForDevice(
                          parseInt(group.dg_id),
                          device.externalId,
                          devicereadstartdate,
                          devicereadenddate,
                          certificateTransactionUID,
                        );
                      devicelog.forEach((singleDeviceLogEle) => {
                        singleDeviceLogEle.externalId =
                          device.developerExternalId;
                        singleDeviceLogEle['deviceId'] = device.id;
                        singleDeviceLogEle['timezone'] =
                          getLocalTimeZoneFromDevice(device.createdAt, device);

                        certificatesInReservationWithLog[
                          index
                        ].perDeviceCertificateLog.push(singleDeviceLogEle);
                      });
                    } else {
                      devicelog =
                        await this.getCheckCertificateIssueDateLogForDevice(
                          parseInt(group.dg_id),
                          device.externalId,
                          devicereadstartdate,
                          devicereadenddate,
                          certificateTransactionUID,
                        );
                      if (devicelog.length > 0) {
                        const totalReadValue = devicelog.reduce(
                          (accumulator, currentValue) =>
                            accumulator + currentValue.readvalue_watthour,
                          0,
                        );
                        devicelog[0].readvalue_watthour = totalReadValue;
                        devicelog[0].externalId = 'Other Devices';
                        devicelog[0]['deviceId'] = 0;
                        devicelog['timezone'] = getLocalTimeZoneFromDevice(
                          device.createdAt,
                          device,
                        );
                        certificatesInReservationWithLog[
                          index
                        ].perDeviceCertificateLog.push(devicelog[0]);
                      }
                    }
                  }
                  if (role === 'Buyer' || role === Role.ApiUser) {
                    devicelog =
                      await this.getCheckCertificateIssueDateLogForDevice(
                        parseInt(group.dg_id),
                        device.externalId,
                        devicereadstartdate,
                        devicereadenddate,
                        certificateTransactionUID,
                      );
                    devicelog.forEach((singleDeviceLogEle) => {
                      singleDeviceLogEle.externalId =
                        device.developerExternalId;
                      singleDeviceLogEle['deviceId'] = device.id;
                      singleDeviceLogEle['timezone'] =
                        getLocalTimeZoneFromDevice(device.createdAt, device);
                      certificatesInReservationWithLog[
                        index
                      ].perDeviceCertificateLog.push(singleDeviceLogEle);
                    });
                  }
                  return devicelog;
                }),
              );
              finalcertificatesInReservationWithLog.push(
                certificatesInReservationWithLog[index],
              );
              return certificatesInReservationWithLog[index];
            },
          ),
        );
      }),
    );
    const response = {
      certificatelog: finalcertificatesInReservationWithLog,
      currentpage: reservationInfo.pageNumber,
      totalPages: reservationInfo.totalPages,
      totalCount: reservationInfo.totalCount,
    };
    return response;
  }

  /**Create new function to get the certifcate log of perdevice */
  async findPerDeviceCertificateLog(
    groupId: number,
    organizationId: number,
  ): Promise<CheckCertificateIssueDateLogForDeviceEntity[]> {
    this.logger.verbose(`With in findCertificateLog`);
    const totalNumbers: any = getManager()
      .createQueryBuilder()
      .select('d.developerExternalId', 'externalId')
      .addSelect('dg.name', 'reservation_name')
      .addSelect(
        'dl.certificate_issuance_startdate',
        'certificate_issuance_startdate',
      )
      .addSelect(
        'dl.certificate_issuance_enddate',
        'certificate_issuance_enddate',
      )
      .addSelect('dl.readvalue_watthour', 'readvalue_watthour')
      .addSelect('dl.certificateTransactionUID', 'certificateTransactionUID')
      .addSelect('crm.blockchainCertificateId', 'blockchainCertificateId')
      .from(CheckCertificateIssueDateLogForDeviceEntity, 'dl')
      .leftJoin(DeviceGroup, 'dg', 'dl.groupId = dg.id')
      .leftJoin(Device, 'd', 'dl.externalId = d.externalId')
      .innerJoin(
        CertificateReadModelEntity,
        'crm',
        "dl.certificateTransactionUID = (crm.metadata::jsonb)->>'certificateTransactionUID'",
      )
      .where('dl.groupId = :groupId', { groupId: groupId })
      .andWhere('dg.organizationId = :organizationId', {
        organizationId: organizationId,
      })
      .andWhere('dl.readvalue_watthour>0');
    const devicelog = await totalNumbers.getRawMany();

    return devicelog;
  }

  async createCSV(
    res: Response,
    groupId: number,
    organizationId: number,
    name: string,
  ): Promise<void> {
    try {
      const data = await this.findPerDeviceCertificateLog(
        groupId,
        organizationId,
      );
      this.logger.error(`Error generating CSV: ${data[0]}`);
      const headers = Object.keys(data[0]);
      if (headers !== undefined) {
        res.setHeader(
          'Content-Disposition',
          'attachment; filename=' +
            name +
            ' ' +
            new Date().toLocaleDateString() +
            '.csv',
        );
        res.setHeader('Content-Type', 'text/csv');
        const csvString = `${headers.join(',')}\n${data.map((obj) => headers.map((key) => obj[key]).join(',')).join('\n')}`;
        // Stream the CSV string to the response
        res.write(csvString, 'utf-8', () => {
          this.logger.log('The CSV file streamed successfully!');
          res.end();
        });
      }
    } catch (error) {
      this.logger.error(`Error generating CSV: ${error.message}`);

      throw new HttpException('Devices log Not found', HttpStatus.NOT_FOUND);
    }
  }
}
