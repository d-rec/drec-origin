import {
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Between,
  Brackets,
  FindConditions,
  FindManyOptions,
  FindOperator,
  LessThan,
  Raw,
  Repository,
  SelectQueryBuilder,
  UpdateResult,
} from 'typeorm';
import { DeviceService } from '../device/device.service';
import {
  AddGroupDTO,
  DeviceGroupDTO,
  EndReservationDateDTO,
  JobFailedRowsDTO,
  NewDeviceGroupDTO,
  NewUpdateDeviceGroupDTO,
  ResponseDeviceGroupDTO,
  UnreservedDeviceGroupsFilterDTO,
} from './dto';
import { cloneDeep, defaults } from 'lodash';
import { DeviceGroup } from './device-group.entity';
import { Device } from '../device/device.entity';
import {
  BuyerReservationCertificateGenerationFrequency,
  DeviceDescription,
  IDevice,
  ILoggedInUser,
  LoggedInUser,
} from '../../models';
import { DeviceDTO, NewDeviceDTO } from '../device/dto';
import {
  CommissioningDateRange,
  DeviceTypeCode,
  FuelCode,
  Installation,
  OffTaker,
  Role,
  Sector,
} from '../../utils/enums';

import moment from 'moment';

import { getCapacityRange } from '../../utils/get-capacity-range';
import { getDateRangeFromYear } from '../../utils/get-commissioning-date-range';
import cleanDeep from 'clean-deep';
import { OrganizationService } from '../organization/organization.service';
import { nanoid } from 'nanoid';
import { HistoryNextIssuanceStatus } from '../../utils/enums/history_next_issuance.enum';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DeviceCsvProcessingFailedRowsEntity } from './device_csv_processing_failed_rows.entity';
import {
  DeviceCsvFileProcessingJobsEntity,
  StatusCSV,
} from './device_csv_processing_jobs.entity';
import { DeviceGroupNextIssueCertificate } from './device_group_issuecertificate.entity';
import csv from 'csv-parser';

import CSVToJsonV2 from 'csvtojson';

import { countryCodesList } from '../../models/country-code';

import { FileService } from '../file';
import { validate } from 'class-validator';
import { YieldConfigService } from '../yield-config/yieldconfig.service';
import { DateTime } from 'luxon';
import { CheckCertificateIssueDateLogForDeviceGroupEntity } from './check_certificate_issue_date_log_for_device_group.entity';
import { HistoryDeviceGroupNextIssueCertificate } from './history_next_issuance_date_log.entity';
import { isValidUTCDateFormat } from '../../utils/checkForISOStringFormat';
import { CertificateReadModelEntity } from '@energyweb/origin-247-certificate/dist/js/src/offchain-certificate/repositories/CertificateReadModel/CertificateReadModel.entity';
import { Certificate } from '@energyweb/issuer-api';
import { UserService } from '../user/user.service';
import { ICertificateMetadata } from '../../utils/types';
import { FilterDTO } from '../certificate-log/dto';
import { CertificateSettingEntity } from './certificate_setting.entity';

@Injectable()
export class DeviceGroupService {
  csvParser = csv({ separator: ',' });
  private readonly logger = new Logger(DeviceGroupService.name);

  constructor(
    @InjectRepository(DeviceCsvProcessingFailedRowsEntity)
    private readonly repositoryJobFailedRows: Repository<DeviceCsvProcessingFailedRowsEntity>,
    @InjectRepository(DeviceCsvFileProcessingJobsEntity)
    private readonly repositoryCSVJobProcessing: Repository<DeviceCsvFileProcessingJobsEntity>,
    @InjectRepository(DeviceGroup)
    private readonly repository: Repository<DeviceGroup>,
    @InjectRepository(DeviceGroupNextIssueCertificate)
    private readonly repositoryNextDeviceGroupCertificate: Repository<DeviceGroupNextIssueCertificate>,
    private organizationService: OrganizationService,
    private deviceService: DeviceService,
    private readonly fileService: FileService,
    private yieldConfigService: YieldConfigService,
    @InjectRepository(CheckCertificateIssueDateLogForDeviceGroupEntity)
    private readonly checkDeviceGroupLogCertificateRepository: Repository<CheckCertificateIssueDateLogForDeviceGroupEntity>,
    @InjectRepository(HistoryDeviceGroupNextIssueCertificate)
    private readonly historyNextIssuanceDateRepository: Repository<HistoryDeviceGroupNextIssueCertificate>,
    @InjectRepository(CertificateReadModelEntity)
    private readonly certificateReadModuleRepository: Repository<
      CertificateReadModelEntity<ICertificateMetadata>
    >,
    private readonly userService: UserService,
    @InjectRepository(CertificateSettingEntity)
    private readonly certificateSettingsRepository: Repository<CertificateSettingEntity>,
  ) {}

  async getAll(
    user?: ILoggedInUser,
    organizationId?: number,
    apiUserId?: string,
    pageNumber?: number,
    limit?: number,
    filterDTO?: UnreservedDeviceGroupsFilterDTO,
  ): Promise<
    | {
        devicegroups: DeviceGroupDTO[];
        currentPage: number;
        totalPages: number;
        totalCount: number;
      }
    | any
  > {
    this.logger.verbose(`With in dg service ${filterDTO}`);
    const query: SelectQueryBuilder<DeviceGroup> = await this.repository
      .createQueryBuilder('group')
      .innerJoin(Device, 'device', 'device.id = ANY("group"."deviceIdsInt")')
      .addSelect('ARRAY_AGG(device."SDGBenefits")', 'sdgBenefits')
      .orderBy('group.createdAt', 'DESC')
      .groupBy('group.id');

    if (apiUserId) {
      if (user.role === Role.Admin && apiUserId === user.api_user_id) {
        query.andWhere(`group.api_user_id IS NULL`);
      } else {
        query.andWhere(`group.api_user_id = '${apiUserId}'`);
      }
    }

    if (organizationId) {
      query.andWhere(`group.organizationId = '${organizationId}'`);
    }

    if (filterDTO) {
      if (
        filterDTO.start_date != undefined &&
        filterDTO.end_date != undefined
      ) {
        if (filterDTO.start_date != null && filterDTO.end_date === null) {
          this.logger.error(`End Date should be mandatory`);
          throw new ConflictException({
            success: false,
            message: `End Date should be mandatory`,
          });
        }

        if (
          !(
            new Date(filterDTO.start_date).getTime() <
            new Date(filterDTO.end_date).getTime()
          )
        ) {
          this.logger.error(`End date should be greater then from Start date`);
          throw new ConflictException({
            success: false,
            message: `End date should be greater then from Start date `,
          });
        }

        if (
          !(
            new Date(filterDTO.start_date).getTime() <
            new Date(filterDTO.end_date).getTime()
          )
        ) {
          this.logger.error(`End date should be greater then from Start date`);
          throw new ConflictException({
            success: false,
            message: `End date should be greater then from Start date `,
          });
        }
      }

      if (filterDTO.country) {
        const values = filterDTO.country.split(',');
        let invalidCountry = false;
        values.forEach((element) => {
          filterDTO.country = element.toUpperCase();
          if (
            filterDTO.country &&
            typeof filterDTO.country === 'string' &&
            filterDTO.country.length === 3
          ) {
            if (
              countryCodesList.find(
                (element) => element.countryCode === filterDTO.country,
              ) === undefined
            ) {
              invalidCountry = true;
            }
          }
        });

        if (!invalidCountry) {
          query.andWhere('group.countryCode @> ARRAY[:...countryCodes]', {
            countryCodes: values,
          });
        }
      }

      if (filterDTO.fuelCode) {
        if (typeof filterDTO.fuelCode === 'string') {
          query.andWhere('group.fuelCode = :fuelcode', {
            fuelcode: [filterDTO.fuelCode],
          });
        } else if (typeof filterDTO.fuelCode === 'object') {
          query.andWhere('group.fuelCode @> ARRAY[:...fuelcode]', {
            fuelcode: filterDTO.fuelCode,
          });
        }
      }

      if (filterDTO.offTaker) {
        const newOffTaker = filterDTO.offTaker.toString();
        const offTakerArray = newOffTaker.split(',');
        query.andWhere(
          new Brackets((qb) => {
            offTakerArray.forEach((offTaker, index) => {
              if (index === 0) {
                qb.orWhere(
                  `EXISTS (SELECT 1 FROM unnest(group.offTakers) ot WHERE ot LIKE :offtaker${index})`,
                  { [`offtaker${index}`]: `%${offTaker}%` },
                );
              } else {
                qb.orWhere(
                  `EXISTS (SELECT 1 FROM unnest(group.offTakers) ot WHERE ot LIKE :offtaker${index})`,
                  { [`offtaker${index}`]: `%${offTaker}%` },
                );
              }
            });
          }),
        );
      }

      if (filterDTO.start_date && filterDTO.end_date) {
        query.andWhere(
          new Brackets((db) => {
            db.where(
              new Brackets((db1) => {
                db1
                  .where(
                    'group.reservationStartDate BETWEEN :reservationStartDate1  AND :reservationEndDate1',
                    {
                      reservationStartDate1: filterDTO.start_date,
                      reservationEndDate1: filterDTO.end_date,
                    },
                  )
                  .orWhere(
                    'group.reservationStartDate = :reservationStartDate',
                    { reservationStartDate: filterDTO.start_date },
                  );
              }),
            ).andWhere(
              new Brackets((db2) => {
                db2
                  .where(
                    'group.reservationEndDate  BETWEEN :reservationStartDate2  AND :reservationEndDate2',
                    {
                      reservationStartDate2: filterDTO.start_date,
                      reservationEndDate2: filterDTO.end_date,
                    },
                  )
                  .orWhere(
                    'group.reservationEndDate = :reservationStartDate ',
                    { reservationStartDate: filterDTO.end_date },
                  );
              }),
            );
          }),
        );
      }

      if (filterDTO.sdgbenefit) {
        const sdgBenefitsArray = filterDTO.sdgbenefit.toString().split(',');
        query.andWhere(
          new Brackets((qb) => {
            sdgBenefitsArray.forEach((benefit, index) => {
              if (index === 0) {
                qb.where(`device.SDGBenefits ILIKE :benefit${index}`, {
                  [`benefit${index}`]: `%${benefit}%`,
                });
              } else {
                qb.orWhere(`device.SDGBenefits ILIKE :benefit${index}`, {
                  [`benefit${index}`]: `%${benefit}%`,
                });
              }
            });
          }),
        );
      }
      if (filterDTO.name) {
        const name = filterDTO.name.toString();
        const baseQuery = 'group.name ILIKE :name';
        query.andWhere(baseQuery, { name: `%${name}%` });
      }
      if (filterDTO.reservationActive) {
        if (filterDTO.reservationActive === 'Active') {
          query.andWhere('group.reservationActive = :active', { active: true });
        }
        if (filterDTO.reservationActive === 'Deactive') {
          query.andWhere('group.reservationActive = :active', {
            active: false,
          });
        }
      }
    }

    const [groups, totalCount] = await query
      .skip((pageNumber - 1) * limit)
      .take(limit)
      .getManyAndCount();
    const totalPages = Math.ceil(totalCount / limit);
    const groupsWithOrganization = await Promise.all(
      groups.map(async (group: DeviceGroupDTO) => {
        const organization = await this.organizationService.findOne(
          group.organizationId,
        );
        group.organization = {
          name: organization.name,
        };
        return group;
      }),
    );

    return {
      groupedData: groupsWithOrganization,
      currentPage: pageNumber,
      totalPages,
      totalCount,
    };
  }

  async findById(id: number, user?: ILoggedInUser): Promise<DeviceGroupDTO> {
    this.logger.verbose(`With in findById`);
    const deviceGroup = await this.repository.findOne({
      where: {
        id: id,
      },
    });
    if (!deviceGroup) {
      this.logger.error(`No device group found with id ${id}`);
      throw new NotFoundException(`No device group found with id ${id}`);
    }
    if (user) {
      if (user.role === Role.ApiUser) {
        const organization = await this.organizationService.findOne(
          user.organizationId,
        );
        const orgUser = await this.userService.findByEmail(
          organization.orgEmail,
        );
        if (
          orgUser.role === Role.OrganizationAdmin ||
          orgUser.role === Role.DeviceOwner
        ) {
          const isMyDevice = await this.checkDeveloperOrganization(
            deviceGroup.deviceIdsInt,
            user.organizationId,
          );
          if (!isMyDevice) {
            this.logger.error(
              `Unauthorized to view the reservation of other's devices`,
            );
            throw new UnauthorizedException({
              success: false,
              message: `Unauthorized to view the reservation of other's devices`,
            });
          }
        } else if (
          orgUser.role === Role.Buyer ||
          orgUser.role === Role.SubBuyer
        ) {
          if (deviceGroup.organizationId != user.organizationId) {
            this.logger.error(
              `Unauthorized to view the reservation of other organizations`,
            );
            throw new UnauthorizedException({
              success: false,
              message: `Unauthorized to view the reservation of other organizations`,
            });
          }
        }
      } else {
        if (
          user.role === Role.OrganizationAdmin ||
          user.role === Role.DeviceOwner
        ) {
          const isMyDevice = await this.checkDeveloperOrganization(
            deviceGroup.deviceIdsInt,
            user.organizationId,
          );
          if (!isMyDevice) {
            this.logger.error(
              `Unauthorized to view the reservation of other's devices`,
            );
            throw new UnauthorizedException({
              success: false,
              message: `Unauthorized to view the reservation of other's devices`,
            });
          }
        } else if (user.role === Role.Buyer || user.role === Role.SubBuyer) {
          if (deviceGroup.organizationId != user.organizationId) {
            this.logger.error(
              `Unauthorized to view the reservation of other organizations`,
            );
            throw new UnauthorizedException({
              success: false,
              message: `Unauthorized to view the reservation of other organizations`,
            });
          }
        }
      }
    }

    deviceGroup.devices = await this.deviceService.findForGroup(deviceGroup.id);
    const organization = await this.organizationService.findOne(
      deviceGroup.organizationId,
    );
    deviceGroup.organization = {
      name: organization.name,
      blockchainAccountAddress: organization.blockchainAccountAddress,
    };
    return deviceGroup;
  }

  async getOrganizationDeviceGroups(
    organizationId: number,
  ): Promise<DeviceGroupDTO[]> {
    this.logger.verbose(`With in getOrganizationDeviceGroups`);
    return this.repository.find({
      where: { organizationId },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async getBuyerDeviceGroups(
    buyerId: number,
    pageNumber?: number,
    groupFilterDTO?: UnreservedDeviceGroupsFilterDTO,
  ): Promise<any> {
    this.logger.verbose(`With in getBuyerDeviceGroups`);
    let queryBuilder: any;
    const pageSize = 10;

    if (!groupFilterDTO || Object.keys(groupFilterDTO).length === 0) {
      queryBuilder = this.repository
        .createQueryBuilder('dg')
        .innerJoin(Device, 'd', 'd.id = ANY(dg."deviceIdsInt")')
        .addSelect('ARRAY_AGG(d."SDGBenefits")', 'sdgBenefits')
        .orderBy('dg.id', 'ASC')
        .groupBy('dg.id');
      queryBuilder.where((qb) => {
        qb.where(`dg.buyerId = :buyerid `, {
          buyerid: buyerId,
        });
      });
    } else {
      if (
        groupFilterDTO.start_date != undefined &&
        groupFilterDTO.end_date != undefined
      ) {
        if (
          groupFilterDTO.start_date != null &&
          groupFilterDTO.end_date === null
        ) {
          this.logger.error(`End Date should be mandatory`);
          throw new ConflictException({
            success: false,
            message: `End Date should be mandatory`,
          });
        }

        if (
          !(
            new Date(groupFilterDTO.start_date).getTime() <
            new Date(groupFilterDTO.end_date).getTime()
          )
        ) {
          this.logger.error(`End date should be greater then from Start date`);
          throw new ConflictException({
            success: false,
            message: `End date should be greater then from Start date `,
          });
        }
      }
      this.logger.debug('Line No: 187');
      queryBuilder = this.repository
        .createQueryBuilder('dg')
        .innerJoin(Device, 'd', 'd.id = ANY(dg."deviceIdsInt")')
        .addSelect('ARRAY_AGG(d."SDGBenefits")', 'sdgBenefits')
        .orderBy('dg.id', 'ASC')
        .groupBy('dg.id');

      queryBuilder.where((qb) => {
        qb.where(`dg.buyerId = :buyerid `, {
          buyerid: buyerId,
        }).andWhere(
          new Brackets((qb) => {
            if (groupFilterDTO.country) {
              const string = groupFilterDTO.country;
              const values = string.split(',');
              let CountryInvalid = false;
              values.forEach((ele) => {
                groupFilterDTO.country = ele.toUpperCase();
                if (
                  groupFilterDTO.country &&
                  typeof groupFilterDTO.country === 'string' &&
                  groupFilterDTO.country.length === 3
                ) {
                  if (
                    countryCodesList.find(
                      (ele) => ele.countryCode === groupFilterDTO.country,
                    ) === undefined
                  ) {
                    CountryInvalid = true;
                  }
                }
              });
              if (!CountryInvalid) {
                qb.orWhere('dg.countryCode @> ARRAY[:...countrycode]', {
                  countrycode: values,
                });
              }
            }
            if (groupFilterDTO.fuelCode) {
              if (typeof groupFilterDTO.fuelCode === 'string') {
                qb.orWhere('dg.fuelCode = :fuelcode', {
                  fuelcode: [groupFilterDTO.fuelCode],
                });
              } else if (typeof groupFilterDTO.fuelCode === 'object') {
                qb.orWhere('dg.fuelCode @> ARRAY[:...fuelcode]', {
                  fuelcode: groupFilterDTO.fuelCode,
                });
              }
            }
            if (groupFilterDTO.offTaker) {
              const newOffTaker = groupFilterDTO.offTaker.toString();
              const offTakerArray = newOffTaker.split(',');
              qb.orWhere(
                new Brackets((qb) => {
                  offTakerArray.forEach((offTaker, index) => {
                    if (index === 0) {
                      qb.orWhere(
                        `EXISTS (SELECT 1 FROM unnest(dg.offTakers) ot WHERE ot LIKE :offtaker${index})`,
                        { [`offtaker${index}`]: `%${offTaker}%` },
                      );
                    } else {
                      qb.orWhere(
                        `EXISTS (SELECT 1 FROM unnest(dg.offTakers) ot WHERE ot LIKE :offtaker${index})`,
                        { [`offtaker${index}`]: `%${offTaker}%` },
                      );
                    }
                  });
                }),
              );
            }

            if (groupFilterDTO.start_date && groupFilterDTO.end_date) {
              qb.orWhere(
                new Brackets((db) => {
                  db.where(
                    new Brackets((db1) => {
                      db1
                        .where(
                          'dg.reservationStartDate BETWEEN :reservationStartDate1  AND :reservationEndDate1',
                          {
                            reservationStartDate1: groupFilterDTO.start_date,
                            reservationEndDate1: groupFilterDTO.end_date,
                          },
                        )
                        .orWhere(
                          'dg.reservationStartDate = :reservationStartDate',
                          { reservationStartDate: groupFilterDTO.start_date },
                        );
                    }),
                  ).andWhere(
                    new Brackets((db2) => {
                      db2
                        .where(
                          'dg.reservationEndDate  BETWEEN :reservationStartDate2  AND :reservationEndDate2',
                          {
                            reservationStartDate2: groupFilterDTO.start_date,
                            reservationEndDate2: groupFilterDTO.end_date,
                          },
                        )
                        .orWhere(
                          'dg.reservationEndDate = :reservationStartDate ',
                          { reservationStartDate: groupFilterDTO.end_date },
                        );
                    }),
                  );
                }),
              );
            }

            if (groupFilterDTO.sdgbenefit) {
              const newSDG = groupFilterDTO.sdgbenefit.toString();

              const sdgBenefitsArray = newSDG.split(',');

              sdgBenefitsArray.map((benefit) => benefit).join(',');

              qb.orWhere(
                new Brackets((qb) => {
                  sdgBenefitsArray.forEach((benefit, index) => {
                    if (index === 0) {
                      qb.where(`d.SDGBenefits ILIKE :benefit${index}`, {
                        [`benefit${index}`]: `%${benefit}%`,
                      });
                    } else {
                      qb.orWhere(`d.SDGBenefits ILIKE :benefit${index}`, {
                        [`benefit${index}`]: `%${benefit}%`,
                      });
                    }
                  });
                }),
              );
            }
            if (groupFilterDTO.name) {
              const name = groupFilterDTO.name.toString();
              const baseQuery = 'dg.name ILIKE :name';
              qb.andWhere(baseQuery, { name: `%${name}%` });
            }
            if (groupFilterDTO.reservationActive) {
              if (groupFilterDTO.reservationActive === 'Active') {
                qb.orWhere('dg.reservationActive = :active', { active: true });
              }
              if (groupFilterDTO.reservationActive === 'Deactive') {
                qb.orWhere('dg.reservationActive = :active', { active: false });
              }
            }
          }),
        );
      });
      await queryBuilder.getSql();
    }
    const skip = (pageNumber - 1) * pageSize;

    const groupedData = await queryBuilder
      .offset(skip)
      .limit(pageSize)
      .getRawMany();
    this.logger.debug(queryBuilder.getSql());
    const totalCountQuery = await queryBuilder.getCount();

    const totalPages = Math.ceil(totalCountQuery / pageSize);
    if (totalCountQuery > 0) {
      if (pageNumber > totalPages) {
        this.logger.error(`Page number out of range`);
        throw new HttpException(
          'Page number out of range',
          HttpStatus.NOT_FOUND,
        );
      }
    }

    // If deviceGroups is not an array, return an empty array
    const finalReservation = groupedData.map((deviceGroup) => ({
      id: deviceGroup.dg_id,
      createdAt: deviceGroup.dg_createdAt,
      name: deviceGroup.dg_name,
      organizationId: deviceGroup.dg_organizationId,
      fuelCode: deviceGroup.dg_fuelCode,
      countryCode: deviceGroup.dg_countryCode,
      deviceTypeCodes: deviceGroup.dg_deviceTypeCodes,
      offTakers: deviceGroup.dg_offTakers,
      commissioningDateRange: deviceGroup.dg_commissioningDateRange,
      gridInterconnection: deviceGroup.dg_gridInterconnection,
      aggregatedCapacity: deviceGroup.dg_aggregatedCapacity,
      yieldValue: deviceGroup.dg_yieldValue,
      buyerId: deviceGroup.dg_buyerId,
      buyerAddress: deviceGroup.dg_buyerAddress,
      leftoverReads: deviceGroup.dg_leftoverReads,
      capacityRange: deviceGroup.dg_capacityRange,
      frequency: deviceGroup.dg_frequency,
      reservationStartDate: deviceGroup.dg_reservationStartDate,
      reservationEndDate: deviceGroup.dg_reservationEndDate,
      reservationActive: deviceGroup.dg_reservationActive,
      targetVolumeInMegaWattHour: deviceGroup.dg_targetVolumeInMegaWattHour,
      targetVolumeCertificateGenerationRequestedInMegaWattHour:
        deviceGroup.dg_targetVolumeCertificateGenerationRequestedInMegaWattHour,
      targetVolumeCertificateGenerationSucceededInMegaWattHour:
        deviceGroup.dg_targetVolumeCertificateGenerationSucceededInMegaWattHour,
      targetVolumeCertificateGenerationFailedInMegaWattHour:
        deviceGroup.dg_targetVolumeCertificateGenerationFailedInMegaWattHour,
      authorityToExceed: deviceGroup.dg_authorityToExceed,
      leftoverReadsByCountryCode: deviceGroup.dg_leftoverReadsByCountryCode,
      devicegroup_uid: deviceGroup.dg_devicegroup_uid,
      type: deviceGroup.dg_type,
      deviceIds: deviceGroup.dg_deviceIdsInt,
      SDGBenefits: Array.from(new Set(deviceGroup.sdgBenefits)),
    }));
    return {
      groupedData: finalReservation,
      pageNumber,
      totalPages,
      totalCount: totalCountQuery,
    };
  }

  async findOne(
    conditions: FindConditions<DeviceGroup>,
  ): Promise<DeviceGroup | null> {
    this.logger.verbose(`With in findOne`);
    return (await this.repository.findOne(conditions)) ?? null;
  }

  async createCSVJobForFile(
    userId: number,
    organizationId: number,
    status: StatusCSV,
    fileId: string,
    api_user_id?: string,
  ): Promise<DeviceCsvFileProcessingJobsEntity> {
    this.logger.verbose(`With in createCSVJobForFile`);
    return await this.repositoryCSVJobProcessing.save({
      userId,
      organizationId,
      status,
      fileId,
      api_user_id,
    });
  }

  async getAllCSVJobsForOrganization(
    organizationId: number,
    pageNumber?: number,
    limit?: number,
  ): Promise<
    | {
        csvJobs: Array<DeviceCsvFileProcessingJobsEntity>;
        currentPage: number;
        totalPages: number;
        totalCount: number;
      }
    | any
  > {
    this.logger.verbose(`With in getAllCSVJobsForOrganization`);
    const [csvJobs, totalCount] =
      await this.repositoryCSVJobProcessing.findAndCount({
        where: { organizationId },
        order: {
          createdAt: 'DESC',
        },
        skip: (pageNumber - 1) * limit,
        take: limit,
      });

    const totalPages = Math.ceil(totalCount / limit);

    const csvJobsWithOrganization = await Promise.all(
      csvJobs.map(async (csvJob: DeviceCsvFileProcessingJobsEntity) => {
        const organization = await this.organizationService.findOne(
          csvJob.organizationId,
        );
        csvJob.organization = {
          name: organization.name,
        };
        return csvJob;
      }),
    );

    return {
      csvJobs: csvJobsWithOrganization,
      currentPage: pageNumber,
      totalPages,
      totalCount,
    };
  }
  async getAllCSVJobsForAdmin(
    orgId?: number,
    pageNumber?: number,
    limit?: number,
  ): Promise<
    | {
        csvJobs: Array<DeviceCsvFileProcessingJobsEntity>;
        currentPage: number;
        totalPages: number;
        totalCount: number;
      }
    | any
  > {
    this.logger.verbose(`With in getAllCSVJobsForAdmin`);
    const whereConditions: any = {};

    if (orgId) {
      whereConditions.organizationId = orgId;
    }

    const [csvJobs, totalCount] =
      await this.repositoryCSVJobProcessing.findAndCount({
        where: whereConditions,
        order: {
          createdAt: 'DESC',
        },
        skip: (pageNumber - 1) * limit,
        take: limit,
      });

    const totalPages = Math.ceil(totalCount / limit);

    const csvJobsWithOrganization = await Promise.all(
      csvJobs.map(async (csvJob: DeviceCsvFileProcessingJobsEntity) => {
        const organization = await this.organizationService.findOne(
          csvJob.organizationId,
        );
        csvJob.organization = {
          name: organization.name,
        };
        return csvJob;
      }),
    );

    return {
      csvJobs: csvJobsWithOrganization,
      currentPage: pageNumber,
      totalPages,
      totalCount,
    };
  }
  async createFailedRowDetailsForCSVJob(
    jobId: number,
    errorDetails: Array<any>,
    successfullyAddedRowsAndExternalIds: Array<{
      rowNumber: number;
      externalId: string;
    }>,
  ): Promise<DeviceCsvProcessingFailedRowsEntity | undefined> {
    this.logger.verbose(`With in createFailedRowDetailsForCSVJob`);
    return await this.repositoryJobFailedRows.save({
      jobId,
      errorDetails: {
        log: { errorDetails, successfullyAddedRowsAndExternalIds },
      },
    });
  }

  async getFailedRowDetailsForCSVJob(
    jobId: number,
    organizationId?: number,
  ): Promise<JobFailedRowsDTO | undefined> {
    this.logger.verbose(`With in getFailedRowDetailsForCSVJob`);
    if (organizationId) {
      const csvJob = await this.repositoryCSVJobProcessing.findOne({
        where: {
          jobId: jobId,
          organizationId: organizationId,
        },
      });

      if (!csvJob) {
        this.logger.error(`The job requested is belongs to other organization`);
        throw new UnauthorizedException({
          success: false,
          message: `The job requested is belongs to other organization`,
        });
      }
    }

    return await this.repositoryJobFailedRows.findOne({
      where: {
        jobId: jobId,
      },
    });
  }

  async create(
    organizationId: number,
    data: NewDeviceGroupDTO,
    fromBulk = false,
  ): Promise<DeviceGroupDTO> {
    this.logger.verbose(`With in create`);
    const groupName =
      (await this.checkNameConflict(data.name, fromBulk)) || data.name;
    const group = await this.repository.save({
      organizationId,
      ...data,
      name: groupName,
    });
    const devices = await this.deviceService.findByIds(data.deviceIds);
    let allDevicesHaveHistoricalIssuanceAndNoNextIssuance = false;
    devices.filter((ele) => {
      if (
        new Date(data.reservationStartDate).getTime() <
          new Date(ele.createdAt).getTime() &&
        new Date(data.reservationEndDate).getTime() <=
          new Date(ele.createdAt).getTime()
      ) {
        return true;
      }
    }).length === devices.length
      ? (allDevicesHaveHistoricalIssuanceAndNoNextIssuance = true)
      : (allDevicesHaveHistoricalIssuanceAndNoNextIssuance = false);
    if (!allDevicesHaveHistoricalIssuanceAndNoNextIssuance) {
      let minimumDeviceCreatedAtDate: Date = new Date(2993430403962); // future date in 2064 just to find minimum
      let minimumDeviceCreatedAtIndex = 0;
      devices.forEach((ele, index) => {
        const eleDate = new Date(ele.createdAt);
        if (eleDate.getTime() < minimumDeviceCreatedAtDate.getTime()) {
          minimumDeviceCreatedAtDate = eleDate;
          minimumDeviceCreatedAtIndex = index;
        }
      });

      //if minimum device created at i.e onboarded date is lesser than reservation start date then that will be next issuance start date else we take minimum
      //as we will start issuance for next issuance for devices only whose createdAt is before next issuance start date
      let startDate = '';
      if (
        minimumDeviceCreatedAtDate.getTime() <
        new Date(data.reservationStartDate).getTime()
      ) {
        startDate = new Date(data.reservationStartDate).toISOString();
      } else {
        startDate = minimumDeviceCreatedAtDate.toISOString();
      }

      let hours = 1;

      const frequency = group.frequency.toLowerCase();
      if (frequency === BuyerReservationCertificateGenerationFrequency.daily) {
        hours = 1 * 24;
      } else if (
        frequency === BuyerReservationCertificateGenerationFrequency.monthly
      ) {
        hours = 30 * 24;
      } else if (
        frequency === BuyerReservationCertificateGenerationFrequency.weekly
      ) {
        hours = 7 * 24;
      } else if (
        frequency === BuyerReservationCertificateGenerationFrequency.quarterly
      ) {
        hours = 91 * 24;
      }
      let newEndDate = '';
      const endDate = new Date(
        new Date(startDate).getTime() + hours * 3.6e6,
      ).toISOString();

      if (
        new Date(endDate).getTime() <
        new Date(data.reservationEndDate).getTime()
      ) {
        newEndDate = endDate;
      } else {
        newEndDate = data.reservationEndDate.toISOString();
      }
      //when there are multiple devices and there is device next to minimumCreatedAt but less than next possible end date
      //then we consider that as end_date for next issuance else we might loose data for that particular device when next issuance frequency is added in cron
      let nextMinimumCreatedWhichIsLessThanEndDate = false;
      let nextMinimumCreatedAtString = '';
      devices.forEach((ele, index) => {
        if (index != minimumDeviceCreatedAtIndex) {
          if (
            new Date(ele.createdAt).getTime() < new Date(newEndDate).getTime()
          ) {
            nextMinimumCreatedWhichIsLessThanEndDate = true;
            if (nextMinimumCreatedAtString === '') {
              nextMinimumCreatedAtString = new Date(
                ele.createdAt,
              ).toISOString();
            } else {
              //check if nextMinimum is not minimum then change else leave it
              if (
                new Date(ele.createdAt).getTime() <
                new Date(nextMinimumCreatedAtString).getTime()
              ) {
                nextMinimumCreatedAtString = new Date(
                  ele.createdAt,
                ).toISOString();
              }
            }
          }
        }
      });
      if (nextMinimumCreatedWhichIsLessThanEndDate) {
        if (
          !(
            new Date(startDate).getTime() >
            new Date(nextMinimumCreatedAtString).getTime()
          )
        ) {
          newEndDate = nextMinimumCreatedAtString;
        }
      }

      this.repositoryNextDeviceGroupCertificate.save({
        start_date: startDate,
        end_date: newEndDate,
        groupId: group.id,
      });
    }
    await Promise.all(
      devices.map(async (device: Device) => {
        if (
          new Date(data.reservationStartDate).getTime() <
          new Date(device.createdAt).getTime()
        ) {
          await this.historyNextIssuanceDateRepository.save({
            groupId: group.id,
            device_externalid: device.externalId,
            reservationStartDate: data.reservationStartDate,
            reservationEndDate:
              new Date(data.reservationEndDate).getTime() <
              new Date(device.createdAt).getTime()
                ? data.reservationEndDate
                : device.createdAt,
            device_createdAt: device.createdAt,
            status: HistoryNextIssuanceStatus.Pending,
          });
        }
        return await this.deviceService.addGroupIdToDeviceForReserving(
          device,
          group.id,
        );
      }),
    );

    return group;
  }

  async createOne(
    organizationId: number,
    group: AddGroupDTO,
    buyerId?: number,
    buyerAddress?: string,
  ): Promise<ResponseDeviceGroupDTO> {
    this.logger.verbose(`With in createOne`);
    let smallHackAsEvenAfterReturnReservationGettingCreatedWillUseBoolean =
      false;
    let devices =
      await this.deviceService.findByIdsWithoutGroupIdsAssignedImpliesWithoutReservation(
        group.deviceIds,
      );
    const unavailableDeviceIdsDueToAlreadyIncludedInBuyerReservation: Array<number> =
      [];
    devices.forEach((ele) =>
      ele.groupId != null
        ? unavailableDeviceIdsDueToAlreadyIncludedInBuyerReservation.push(
            ele.id,
          )
        : '',
    );
    devices = devices.filter((ele) => ele.groupId === null);
    if (devices.length === 0) {
      smallHackAsEvenAfterReturnReservationGettingCreatedWillUseBoolean = true;
      this.logger.error(
        `Devices ${unavailableDeviceIdsDueToAlreadyIncludedInBuyerReservation.join(' , ')} are already included in buyer reservation, please add other devices`,
      );
      throw new ConflictException({
        success: false,
        message: `Devices ${unavailableDeviceIdsDueToAlreadyIncludedInBuyerReservation.join(' , ')} are already included in buyer reservation, please add other devices`,
      });
    }
    let allDevicesAvailableForBuyerReservation = true;
    const unavailableDeviceIds: Array<number> = [];
    const unavailableDeviceIdsDueToCertificateAlreadyIssued: Array<number> = [];
    if (devices.length === 0) {
      smallHackAsEvenAfterReturnReservationGettingCreatedWillUseBoolean = true;
      this.logger.error(
        `Devices ${unavailableDeviceIdsDueToAlreadyIncludedInBuyerReservation.join(' , ')} are already included in buyer reservation, please add other devices`,
      );
      return new Promise((resolve, reject) => {
        let message = '';
        if (
          unavailableDeviceIdsDueToAlreadyIncludedInBuyerReservation.length > 0
        ) {
          message =
            message +
            `Devices ${unavailableDeviceIdsDueToAlreadyIncludedInBuyerReservation.join(' , ')} are already included in buyer reservation, please add other devices`;
        }
        this.logger.error(
          `Devices ${unavailableDeviceIdsDueToCertificateAlreadyIssued.join(' , ')} have already certified data in that date range and please add other devices or select different date range`,
        );
        message =
          message +
          `Devices ${unavailableDeviceIdsDueToCertificateAlreadyIssued.join(' , ')} have already certified data in that date range and please add other devices or select different date range`;
        reject(
          new ConflictException({
            success: false,
            message: message,
          }),
        );
      });
    }
    group.deviceIds.forEach((ele) => {
      if (!devices.find((deviceSingle) => deviceSingle.id === ele)) {
        allDevicesAvailableForBuyerReservation = false;
        unavailableDeviceIds.push(ele);
      }
    });
    if (
      !group.continueWithReservationIfOneOrMoreDevicesUnavailableForReservation
    ) {
      if (!allDevicesAvailableForBuyerReservation) {
        this.logger.error(
          `One or more devices device Ids: ' + unavailableDeviceIds.join(',') + ' are already included in buyer reservation, please add other devices`,
        );
        throw new ConflictException({
          success: false,
          message:
            'One or more devices device Ids: ' +
            unavailableDeviceIds.join(',') +
            ' are already included in buyer reservation, please add other devices',
        });
      }
    }
    if (
      !group.continueWithReservationIfTargetCapacityIsLessThanDeviceTotalCapacityBetweenDuration
    ) {
      let aggregatedCapacity = 0;
      devices.forEach(
        (ele) => (aggregatedCapacity = ele.capacity + aggregatedCapacity),
      );
      const reservationStartDate = DateTime.fromISO(
        new Date(group.reservationStartDate).toISOString(),
      );
      const reservationEndDate = DateTime.fromISO(
        new Date(group.reservationEndDate).toISOString(),
      );
      const meteredTimePeriodInHours = Math.abs(
        reservationEndDate.diff(reservationStartDate, ['hours']).toObject()
          ?.hours || 0,
      );
      const targetCapacityInKiloWattHour =
        group.targetCapacityInMegaWattHour * 1000;
      if (
        aggregatedCapacity * meteredTimePeriodInHours <
        targetCapacityInKiloWattHour
      ) {
        this.logger.error(
          `Target Capacity Cannot be reached by selected devices within provided start date and end date, either add more devices or increase the end date duration`,
        );
        throw new ConflictException({
          success: false,
          message:
            'Target Capacity Cannot be reached by selected devices within provided start date and end date, either add more devices or increase the end date duration',
          details: {
            meteredTimePeriodInHours,
            targetCapacityInMegaWattHour: group.targetCapacityInMegaWattHour,
            probablyAchievableCapacityInMegaWattHour:
              aggregatedCapacity * meteredTimePeriodInHours * 0.001,
          },
        });
      }
    }
    if (
      smallHackAsEvenAfterReturnReservationGettingCreatedWillUseBoolean ===
      false
    ) {
      const deviceGroup: NewDeviceGroupDTO = this.createDeviceGroupFromDevices(
        devices,
        group.name,
      );
      deviceGroup['reservationStartDate'] = group.reservationStartDate;
      deviceGroup['reservationEndDate'] = group.reservationEndDate;
      deviceGroup['authorityToExceed'] = group.authorityToExceed;
      deviceGroup['targetVolumeInMegaWattHour'] =
        group.targetCapacityInMegaWattHour;
      deviceGroup['targetVolumeCertificateGenerationFailedInMegaWattHour'] = 0;
      deviceGroup['targetVolumeCertificateGenerationSucceededInMegaWattHour'] =
        0;
      deviceGroup['targetVolumeCertificateGenerationRequestedInMegaWattHour'] =
        0;
      deviceGroup['targetVolumeCertificateGenerationRequestedInMegaWattHour'] =
        0;
      deviceGroup['frequency'] = group.frequency;
      deviceGroup['deviceIdsInt'] = group.deviceIds;
      deviceGroup['reservationActive'] = true;
      if (buyerId && buyerAddress) {
        deviceGroup['buyerId'] = buyerId;
        deviceGroup['buyerAddress'] = buyerAddress;
      }
      if (group.api_user_id) {
        deviceGroup['api_user_id'] = group.api_user_id;
      }
      const configurationSetting =
        await this.certificateSettingsRepository.find();
      const lastCertifiableDate = new Date(group.reservationEndDate);
      lastCertifiableDate.setDate(
        lastCertifiableDate.getDate() + configurationSetting[0].no_of_days,
      );
      if (group.reservationExpiryDate != null) {
        deviceGroup['reservationExpiryDate'] = group.reservationExpiryDate;
      } else {
        deviceGroup['reservationExpiryDate'] = lastCertifiableDate;
      }
      const responseDeviceGroupDTO: ResponseDeviceGroupDTO = await this.create(
        organizationId,
        deviceGroup,
      );
      responseDeviceGroupDTO.unavailableDeviceIDsDueToAreIncludedInBuyerReservation =
        unavailableDeviceIdsDueToAlreadyIncludedInBuyerReservation.length > 0
          ? unavailableDeviceIdsDueToAlreadyIncludedInBuyerReservation.join(
              ' , ',
            )
          : '';
      delete responseDeviceGroupDTO['deviceIdsInt'];
      return responseDeviceGroupDTO;
    }
  }

  async update(
    id: number,
    User: ILoggedInUser,
    data: NewUpdateDeviceGroupDTO,
  ): Promise<DeviceGroupDTO> {
    this.logger.verbose(`With in update`);
    await this.checkNameConflict(data.name);
    let deviceGroup = await this.findDeviceGroupById(id, User.organizationId);
    if (User.id != deviceGroup.buyerId) {
      this.logger.error(`Unable to update data. Unauthorized.`);
      throw new UnauthorizedException({
        success: false,
        message: `Unable to update data. Unauthorized.`,
      });
    }
    deviceGroup = defaults(data, deviceGroup);
    const updatedGroup = await this.repository.save(deviceGroup);
    updatedGroup.devices = await this.deviceService.findForGroup(
      deviceGroup.id,
    );
    return updatedGroup;
  }

  async updateTotalReadingRequestedForCertificateIssuance(
    groupId: number,
    organizationId: number,
    targetVolumeCertificateGenerationRequestedInMegaWattHour: number,
  ): Promise<DeviceGroup> {
    this.logger.verbose(
      `With in updateTotalReadingRequestedForCertificateIssuance`,
    );
    const deviceGroup = await this.findDeviceGroupById(groupId, organizationId);

    deviceGroup.targetVolumeCertificateGenerationRequestedInMegaWattHour =
      deviceGroup.targetVolumeCertificateGenerationRequestedInMegaWattHour +
      targetVolumeCertificateGenerationRequestedInMegaWattHour;

    return await this.repository.save(deviceGroup);
  }

  async updateLeftOverRead(
    id: number,
    leftOverRead: number,
  ): Promise<DeviceGroupDTO> {
    this.logger.verbose(`With in updateLeftOverRead`);
    const deviceGroup = await this.findById(id);
    deviceGroup.leftoverReads = leftOverRead;
    return await this.repository.save(deviceGroup);
  }

  async updateLeftOverReadByCountryCode(
    id: number,
    leftOverRead: number,
    countryCodeKey: string,
  ): Promise<DeviceGroupDTO> {
    this.logger.verbose(`With in updateLeftOverReadByCountryCode`);
    const deviceGroup = await this.findById(id);
    if (
      deviceGroup.leftoverReadsByCountryCode === null ||
      deviceGroup.leftoverReadsByCountryCode === undefined ||
      deviceGroup.leftoverReadsByCountryCode === ''
    ) {
      deviceGroup.leftoverReadsByCountryCode = {};
    }
    if (typeof deviceGroup.leftoverReadsByCountryCode === 'string') {
      deviceGroup.leftoverReadsByCountryCode = JSON.parse(
        deviceGroup.leftoverReadsByCountryCode,
      );
    }
    deviceGroup.leftoverReadsByCountryCode[countryCodeKey] = leftOverRead;
    deviceGroup.leftoverReadsByCountryCode = JSON.stringify(
      deviceGroup.leftoverReadsByCountryCode,
    );
    return await this.repository.save(deviceGroup);
  }

  async remove(id: number, organizationId: number): Promise<void> {
    this.logger.verbose(`With in remove`);
    const deviceGroup = await this.findDeviceGroupById(id, organizationId);

    const devices = await this.deviceService.findForGroup(deviceGroup.id);
    await Promise.all(
      devices.map(async (device: Device) => {
        return await this.deviceService.removeFromGroup(
          device.id,
          deviceGroup.id,
        );
      }),
    );
    await this.repository.delete(id);
  }

  public async checkIfDeviceExisting(
    newDevices: NewDeviceDTO[],
    organizationId: number,
  ): Promise<Array<string>> {
    this.logger.verbose(`With in checkIfDeviceExisting`);
    const allExternalIds: Array<string> = [];
    const existingDeviceIds: Array<string> = [];
    newDevices.forEach((singleDevice) =>
      allExternalIds.push(singleDevice.externalId),
    );
    const existingDevices =
      await this.deviceService.findMultipleDevicesBasedExternalId(
        allExternalIds,
        organizationId,
      );

    if (existingDevices && existingDevices.length > 0) {
      existingDevices.forEach((ele) =>
        existingDeviceIds.push(ele?.developerExternalId),
      );
    }
    return existingDeviceIds;
  }

  public async registerCSVBulkDevices(
    orgCode: number,
    newDevices: NewDeviceDTO[],
    api_user_id?: string,
  ): Promise<
    (DeviceDTO | { isError: boolean; device: NewDeviceDTO; errorDetail: any })[]
  > {
    this.logger.verbose(`With in registerCSVBulkDevicess`);
    return await Promise.all(
      newDevices.map(async (device: NewDeviceDTO) => {
        try {
          if (api_user_id == null) {
            return await this.deviceService.register(orgCode, device);
          } else {
            return await this.deviceService.register(
              orgCode,
              device,
              api_user_id,
              Role.ApiUser,
            );
          }
        } catch (e) {
          this.logger.error(e);
          return { isError: true, device: device, errorDetail: e };
        }
      }),
    );
  }

  private async hasDeviceGroup(conditions: FindConditions<DeviceGroup>) {
    this.logger.verbose(`With in hasDeviceGroup`);
    return Boolean(await this.findOne(conditions));
  }

  private async checkNameConflict(
    name: string,
    fromBulk = false,
  ): Promise<void | string> {
    this.logger.verbose(`With in checkNameConflict`);
    const isExistingDeviceGroup = await this.hasDeviceGroup({ name: name });
    if (isExistingDeviceGroup) {
      if (!fromBulk) {
        const message = `Device group with name ${name} already exists`;

        this.logger.error(message);
        throw new ConflictException({
          success: false,
          message,
        });
      }
      // Example of new name generated: Distributed Energy-IN,Solar,REC,Industrial,StandAlone zLb
      return `${name} ${nanoid(3)}`;
    }
  }

  private async findDeviceGroupById(
    id: number,
    organizationId: number,
  ): Promise<DeviceGroupDTO> {
    this.logger.verbose(`With in findDeviceGroupById`);
    const deviceGroup = await this.repository.findOne({
      where: {
        id,
        organizationId,
      },
    });
    if (!deviceGroup) {
      this.logger.error(
        `No device group found with id ${id} and organization ${organizationId}`,
      );
      throw new NotFoundException(
        `No device group found with id ${id} and organization ${organizationId}`,
      );
    }
    return deviceGroup;
  }

  private async compareDeviceForGrouping(
    initialDevice: IDevice,
    deviceToCompare: IDevice,
  ): Promise<boolean> {
    this.logger.verbose(`With in compareDeviceForGrouping`);
    if (
      !initialDevice ||
      !deviceToCompare ||
      initialDevice.countryCode !== deviceToCompare.countryCode ||
      initialDevice.fuelCode !== deviceToCompare.fuelCode
    ) {
      return false;
    }
    return true;
  }

  private getCommissioningDateRange(
    devices: DeviceDTO[],
  ): CommissioningDateRange[] {
    this.logger.verbose(`With in getCommissioningDateRange`);
    return Array.from(
      new Set(
        devices.map((device: DeviceDTO) =>
          getDateRangeFromYear(device.commissioningDate),
        ),
      ),
    );
  }

  private createDeviceGroupFromDevices(
    devices: DeviceDTO[],
    groupName?: string,
  ): NewDeviceGroupDTO {
    this.logger.verbose(`With in createDeviceGroupFromDevices`);
    const aggregatedCapacity = Math.floor(
      devices.reduce(
        (accumulator, currentValue: DeviceDTO) =>
          accumulator + currentValue.capacity,
        0,
      ),
    );
    // averageYieldValue
    Math.floor(
      devices.reduce(
        (accumulator, currentValue: DeviceDTO) =>
          accumulator + currentValue.yieldValue,
        0,
      ) / devices.length,
    );
    const gridInterconnection = devices.every(
      (device: DeviceDTO) => device.gridInterconnection === true,
    );

    const fuelCode = Array.from(
      new Set(
        devices.map((device: DeviceDTO) =>
          device.fuelCode ? device.fuelCode.trim() : '',
        ),
      ),
    );
    const countryCode = Array.from(
      new Set(
        devices.map((device: DeviceDTO) =>
          device.countryCode ? device.countryCode.trim() : '',
        ),
      ),
    );
    const deviceTypeCodes = Array.from(
      new Set(
        devices.map((device: DeviceDTO) =>
          device.deviceTypeCode ? device.deviceTypeCode.trim() : '',
        ),
      ),
    );
    const offTakers = Array.from(
      new Set(devices.map((device: DeviceDTO) => device.offTaker)),
    );
    //deviceIdsInt
    Array.from(new Set(devices.map((device: DeviceDTO) => device.id)));

    return {
      name: groupName,
      deviceIds: devices.map((device: DeviceDTO) => device.id),
      fuelCode: fuelCode,
      countryCode: countryCode,
      deviceTypeCodes: deviceTypeCodes,
      offTakers: offTakers,
      gridInterconnection,
      aggregatedCapacity,
      capacityRange: getCapacityRange(aggregatedCapacity),
      commissioningDateRange: this.getCommissioningDateRange(devices),
    };
  }

  private getReservationFilteredQuery(
    buyerId: number,
    filter?: UnreservedDeviceGroupsFilterDTO,
  ): FindManyOptions<DeviceGroup> {
    this.logger.verbose(`With in getReservationFilteredQuery`);
    const where: FindConditions<DeviceGroup> = cleanDeep({
      reservationStartDate:
        filter.start_date &&
        filter.end_date &&
        Between(filter.start_date, filter.end_date),
      reservationEndDate:
        filter.start_date &&
        filter.end_date &&
        Between(filter.start_date, filter.end_date),
    });
    if (filter.offTaker) {
      where.offTakers = this.getRawFilter(filter.offTaker);
    }
    return {
      where: {
        buyerId: buyerId || null,
        ...where,
      },
      order: {
        createdAt: 'DESC',
      },
    };
  }

  private getRawFilter(
    filter:
      | Sector
      | Installation
      | OffTaker
      | FuelCode
      | Installation
      | CommissioningDateRange,
  ): FindOperator<any> {
    this.logger.verbose(`With in getRawFilter`);
    return Raw((alias) => `${alias} @> ARRAY[:...filterSectors]`, {
      filterSectors: [filter],
    });
  }

  private async hasSingleAddedJobForCSVProcessing(): Promise<
    DeviceCsvFileProcessingJobsEntity | undefined
  > {
    this.logger.verbose(`With in hasSingleAddedJobForCSVProcessing`);
    return await this.repositoryCSVJobProcessing.findOne({
      where: {
        status: StatusCSV.Added,
      },
    });
  }

  private async updateJobStatus(
    jobId: number,
    status: StatusCSV,
  ): Promise<DeviceCsvFileProcessingJobsEntity> {
    this.logger.verbose(`With in updateJobStatus`);
    const updateResult: UpdateResult =
      await this.repositoryCSVJobProcessing.update(
        { jobId: jobId },
        { status: status },
      );

    if (updateResult.affected === 0) {
      throw new Error(`No job found with ID ${jobId}`);
    }

    return await this.repositoryCSVJobProcessing.findOne({
      where: { jobId: jobId },
    });
  }

  @Cron(CronExpression.EVERY_5_SECONDS)
  //@Cron('*/3 * * * *')
  async getAddedCSVProcessingJobsAndStartProcessing(): Promise<void | any> {
    this.logger.verbose(`With in getAddedCSVProcessingJobsAndStartProcessing`);
    const filesAddedForProcessing =
      await this.hasSingleAddedJobForCSVProcessing();
    if (
      filesAddedForProcessing === undefined ||
      filesAddedForProcessing === null
    ) {
      return;
    }

    const user = await this.userService.findById(
      filesAddedForProcessing.userId,
    );

    const data = new LoggedInUser(user);
    data.id = filesAddedForProcessing.userId;
    data.organizationId = filesAddedForProcessing.organizationId;
    const response = await this.fileService.getUploadS3(
      filesAddedForProcessing.fileId,
    );
    this.logger.debug(response);
    if (response == undefined) {
      return;
    } else {
      this.updateJobStatus(filesAddedForProcessing.jobId, StatusCSV.Running);
      this.processCsvFileAnotherLibrary(
        response,
        filesAddedForProcessing.organizationId,
        filesAddedForProcessing,
      );
    }
  }

  async processCsvFileAnotherLibrary(
    file: Record<string, unknown> | any,
    organizationId: number,
    filesAddedForProcessing: DeviceCsvFileProcessingJobsEntity,
  ): Promise<void | any> {
    this.logger.verbose(`With in processCsvFileAnotherLibrary`);
    this.logger.debug(file.data.Body.toString('utf-8'));
    const records: Array<NewDeviceDTO> = [];
    const recordsErrors: Array<{
      externalId: string;
      rowNumber: number;
      isError: boolean;
      errorsList: Array<any>;
    }> = [];
    let rowsConvertedToCsvCount = 0;
    this.logger.debug('file?.data.toString()', file?.data.toString());
    const fileData = file.data.Body.toString('utf-8');
    this.csvStringToJSON(fileData);

    CSVToJsonV2()
      .fromString(fileData)
      .subscribe(async (data: any) => {
        rowsConvertedToCsvCount++;
        data.images = [];
        data.groupId = null;
        const dataToStore = new NewDeviceDTO();
        dataToStore.SDGBenefits = [];
        dataToStore.version = '1.0';

        const dataKeyForValidation: NewDeviceDTO = {
          externalId: '',
          projectName: '',
          address: '',
          latitude: '',
          longitude: '',
          countryCode: '',
          fuelCode: FuelCode.ES100,
          deviceTypeCode: DeviceTypeCode.TC150,
          capacity: 0,
          commissioningDate: '',
          gridInterconnection: false,
          offTaker: OffTaker.Commercial,
          impactStory: '',
          images: [],
          deviceDescription: DeviceDescription.GroundmountSolar,
          energyStorage: true,
          energyStorageCapacity: 0,
          qualityLabels: '',
          SDGBenefits: [],
          version: '1.0',
        };
        for (const key in dataKeyForValidation) {
          if (key === 'SDGBenefits' || key === 'version') {
            continue;
          }
          if (typeof dataKeyForValidation[key] === 'string') {
            dataToStore[key] = data[key];
          } else if (typeof dataKeyForValidation[key] === 'boolean') {
            dataToStore[key] =
              data[key].toLowerCase() === 'true' ? true : false;
          } else if (typeof dataKeyForValidation[key] === 'number') {
            dataToStore[key] = Number.isNaN(data[key])
              ? 0
              : parseFloat(data[key]);
            if (key == 'yieldValue' && dataToStore[key] === 0) {
              dataToStore[key] = 2000;
            }
          }
          if (key == 'yieldValue' && data.countryCode) {
            const yieldByCountryCode =
              await this.yieldConfigService.findByCountryCode(data.countryCode);
            if (yieldByCountryCode) {
              dataToStore.yieldValue = yieldByCountryCode.yieldValue;
            }
          }
        }
        for (const key in dataToStore) {
          dataToStore[key] === '' ? (dataToStore[key] = null) : '';
        }
        records.push(dataToStore);
        recordsErrors.push({
          externalId: '',
          rowNumber: rowsConvertedToCsvCount,
          isError: false,
          errorsList: [],
        });
      })
      .on('done', async () => {
        for (let index = 0; index < records.length; index++) {
          const singleRecord = records[index];
          if (records[index].externalId) {
            records[index].externalId = records[index].externalId.trim();
          }
          const errors = await validate(singleRecord);
          if (errors.length > 0) {
            errors.forEach((ele) => {
              delete ele.target;
              delete ele.children;
            });
            recordsErrors[index] = {
              externalId: records[index].externalId,
              rowNumber: index,
              isError: true,
              errorsList: errors,
            };
          } else {
            recordsErrors[index] = {
              externalId: records[index].externalId,
              rowNumber: index,
              isError: false,
              errorsList: errors,
            };
          }
          if (singleRecord.countryCode != undefined) {
            singleRecord.countryCode = singleRecord.countryCode.toUpperCase();
            if (
              singleRecord.countryCode &&
              typeof singleRecord.countryCode === 'string' &&
              singleRecord.countryCode.length === 3
            ) {
              if (
                countryCodesList.find(
                  (ele) => ele.countryCode === singleRecord.countryCode,
                ) === undefined
              ) {
                recordsErrors[index].isError = true;
                recordsErrors[index].errorsList.push({
                  value: singleRecord.countryCode,
                  property: 'countryCode',
                  constraints: { invalidCountryCode: 'Invalid countryCode' },
                });
              }
            } else {
              recordsErrors[index].isError = true;
              recordsErrors[index].errorsList.push({
                value: singleRecord.countryCode,
                property: 'countryCode',
                constraints: { invalidCountryCode: 'Invalid countryCode' },
              });
            }
          } else {
            recordsErrors[index].isError = true;
            recordsErrors[index].errorsList.push({
              value: singleRecord.countryCode,
              property: 'countryCode',
              constraints: { invalidCountryCode: 'Invalid countryCode' },
            });
          }
          if (
            singleRecord.commissioningDate &&
            typeof singleRecord.commissioningDate === 'string'
          ) {
            this.logger.debug(
              !isValidUTCDateFormat(singleRecord.commissioningDate),
            );
            if (!isValidUTCDateFormat(singleRecord.commissioningDate)) {
              const hasValidSeconds =
                moment(singleRecord.commissioningDate).seconds() < 60;
              const hasValidMinutes =
                moment(singleRecord.commissioningDate).minutes() < 60;
              recordsErrors[index].isError = true;
              if (!hasValidMinutes) {
                recordsErrors[index].errorsList.push({
                  value: singleRecord.commissioningDate,
                  property: 'commissioningDate',
                  constraints: { invalidDate: 'Invalid minutes value.' },
                });
              } else if (!hasValidSeconds) {
                recordsErrors[index].errorsList.push({
                  value: singleRecord.commissioningDate,
                  property: 'commissioningDate',
                  constraints: { invalidDate: 'Invalid seconds value.' },
                });
              }
              recordsErrors[index].errorsList.push({
                value: singleRecord.commissioningDate,
                property: 'commissioningDate',
                constraints: {
                  invalidDate:
                    'Invalid commission date sent.Format is YYYY-MM-DDThh:mm:ss.millisecondsZ example 2022-10-18T11:35:27.640Z',
                },
              });
            }
            if (
              new Date(singleRecord.commissioningDate).getTime() >
              new Date().getTime()
            ) {
              recordsErrors[index].isError = true;
              recordsErrors[index].errorsList.push({
                value: singleRecord.commissioningDate,
                property: 'commissioningDate',
                constraints: {
                  invalidDate:
                    'Invalid commissioning date, commissioning is greater than current date',
                },
              });
            }
          }
          if (singleRecord.capacity <= 0) {
            recordsErrors[index].isError = true;
            recordsErrors[index].errorsList.push({
              value: singleRecord.capacity,
              property: 'capacity',
              constraints: {
                greaterThanZero: 'Capacity should be greater than 0',
              },
            });
          }
          if (singleRecord.energyStorageCapacity < 0) {
            recordsErrors[index].isError = true;
            recordsErrors[index].errorsList.push({
              value: singleRecord.energyStorageCapacity,
              property: 'energyStorageCapacity',
              constraints: {
                greaterThanZero:
                  'Energy Storage Capacity should be greater than 0',
              },
            });
          }
        }

        records.forEach((singleRecord, index) => {
          recordsErrors[index].errorsList.forEach((error) => {
            singleRecord[error.property] = null; //making null field if it has any validation issue
          });
        });
        // noErrorRecords
        records.filter(
          (record, index) => recordsErrors[index].isError === false,
        );
        const listOfExistingDevices = await this.checkIfDeviceExisting(
          records,
          organizationId,
        );

        if (listOfExistingDevices.length > 0) {
          records.forEach((singleRecord, index) => {
            if (
              listOfExistingDevices.find(
                (ele) => ele === singleRecord.externalId,
              )
            ) {
              recordsErrors[index].isError = true;
              recordsErrors[index].errorsList.push({
                value: singleRecord.externalId,
                property: 'externalId',
                constraints: {
                  externalIdExists:
                    'ExternalId already exist, cant add entry with same external id',
                },
              });
            }
          });
        }
        const recordsCopy = cloneDeep(records);
        recordsCopy.forEach((ele) => (ele['statusDuplicate'] = false));
        const duplicatesExternalId: any = [];
        for (let i = 0; i < recordsCopy.length - 1; i++) {
          this.logger.debug(recordsCopy[i].externalId);
          for (let j = i + 1; j < recordsCopy.length; j++) {
            this.logger.debug(recordsCopy[j].externalId);
            if (
              recordsCopy[i].externalId != null &&
              recordsCopy[j].externalId != null
            ) {
              if (
                recordsCopy[i].externalId.toLowerCase() ===
                  recordsCopy[j].externalId.toLowerCase() &&
                recordsCopy[j]['statusDuplicate'] === false
              ) {
                recordsCopy[j]['statusDuplicate'] = true;
                duplicatesExternalId.push({
                  duplicateIndex: j,
                  duplicateWith: i,
                  projectName: records[j].projectName,
                  externalId: records[j].externalId,
                });
                recordsErrors[j].isError = true;
                recordsErrors[j].errorsList.push({
                  value: recordsCopy[j].externalId,
                  property: 'externalId',
                  constraints: {
                    externalIdExists:
                      'Row ' +
                      (j + 1) +
                      ' Duplicate with row ' +
                      (i + 1) +
                      ' Exists with externalId ' +
                      records[j].externalId,
                  },
                });
              }
            }
          }
        }

        const successfullyAddedRowsAndExternalIds: Array<{
          rowNumber: number;
          externalId: string;
        }> = [];
        const recordsToRegister = records.filter((ele, index) => {
          if (recordsErrors[index].errorsList.length > 0) {
            //these are required fields and if one is having error we cannot try to insert the record
            if (
              recordsErrors[index].errorsList.find(
                (errorRec) =>
                  errorRec.property === 'externalId' ||
                  errorRec.property === 'commissioningDate' ||
                  errorRec.property === 'capacity' ||
                  errorRec.property === 'countryCode',
              )
            ) {
              return false;
            } else {
              return true;
            }
          } else return true;
        });

        const devicesRegistered = await this.registerCSVBulkDevices(
          organizationId,
          recordsToRegister,
          filesAddedForProcessing.api_user_id,
        );

        devicesRegistered
          .filter((ele) => (ele as any).isError === undefined)
          .forEach((ele) => {
            successfullyAddedRowsAndExternalIds.push({
              externalId: (ele as any).externalId,
              rowNumber: records.findIndex(
                (recEle) =>
                  recEle.developerExternalId === (ele as any).externalId,
              ),
            });
          });

        recordsErrors.forEach((ele, index) => {
          if (ele.isError === false) {
            ele['status'] = 'Success';
          } else if (
            ele.isError === true &&
            successfullyAddedRowsAndExternalIds.find(
              (successEle) =>
                successEle.externalId === ele.externalId &&
                successEle.rowNumber === index,
            )
          ) {
            ele['status'] =
              'Success with validation errors, please update fields';
          } else {
            ele['status'] = 'Failed';
          }
        });
        this.createFailedRowDetailsForCSVJob(
          filesAddedForProcessing.jobId,
          recordsErrors,
          successfullyAddedRowsAndExternalIds,
        );
        this.updateJobStatus(
          filesAddedForProcessing.jobId,
          StatusCSV.Completed,
        );
      });
  }

  csvStringToJSON(csvFileContentInString: string): void {
    this.logger.verbose(`With in csvStringToJSON`);

    const array = csvFileContentInString.split('\r');

    // All the rows of the CSV will be
    // converted to JSON objects which
    // will be added to result in an array
    const result = [];

    // The array[0] contains all the
    // header columns so we store them
    // in headers array
    const headers = array[0].split(', ');

    // Since headers are separated, we
    // need to traverse remaining n-1 rows.
    for (let i = 1; i < array.length - 1; i++) {
      const obj = {};

      // Create an empty object to later add
      // values of the current row to it
      // Declare string stringValue as current array
      // value to change the delimiter and
      // store the generated string in a new
      // string s
      const stringValue = array[i];
      let s = '';

      // By Default, we get the comma separated
      // values of a cell in quotes " " so we
      // use flag to keep track of quotes and
      // split the string accordingly
      // If we encounter opening quote (")
      // then we keep commas as it is otherwise
      // we replace them with pipe |
      // We keep adding the characters we
      // traverse to a String s
      let flag = 0;
      for (let ch of stringValue) {
        if (ch === '"' && flag === 0) {
          flag = 1;
        } else if (ch === '"' && flag == 1) flag = 0;
        if (ch === ', ' && flag === 0) ch = '|';
        if (ch !== '"') s += ch;
      }

      // Split the string using pipe delimiter |
      // and store the values in a properties array
      const properties = s.split('|');

      // For each header, if the value contains
      // multiple comma separated data, then we
      // store it in the form of array otherwise
      // directly the value is stored
      for (const j in headers) {
        if (properties[j].includes(', ')) {
          obj[headers[j]] = properties[j]
            .split(', ')
            .map((item) => item.trim());
        } else {
          obj[headers[j]] = properties[j];
        }
      }

      result.push(obj);
    }
  }

  async checkIfOrganizationHasBlockhainAddressAdded(
    organizationId: number,
  ): Promise<boolean> {
    this.logger.verbose(`With in checkIfOrganizationHasBlockhainAddressAdded`);
    const organization = await this.organizationService.findOne(organizationId);
    if (organization.blockchainAccountAddress) {
      return true;
    } else {
      return false;
    }
  }
  async getGroupCertificateIssueDate(
    conditions: FindConditions<DeviceGroupNextIssueCertificate>,
  ): Promise<DeviceGroupNextIssueCertificate | null> {
    this.logger.verbose(`With in getGroupCertificateIssueDate`);
    this.logger.log('Line No: 1883');
    return (
      (await this.repositoryNextDeviceGroupCertificate.findOne(conditions)) ??
      null
    );
  }
  async getAllNextRequestCertificate(): Promise<
    DeviceGroupNextIssueCertificate[]
  > {
    this.logger.verbose(`With in getAllNextRequestCertificate`);
    return await this.repositoryNextDeviceGroupCertificate.find({
      where: { end_date: LessThan(new Date().toISOString()) },
    });
  }
  async getNextRequestCertificateByGroupId(
    groupId: number,
  ): Promise<DeviceGroupNextIssueCertificate> {
    this.logger.verbose(`With in getAllNextRequestCertificate`);
    return await this.repositoryNextDeviceGroupCertificate.findOne({
      where: { groupId: groupId },
    });
  }
  async updateCertificateIssueDate(
    id: number,
    startDate: string,
    endDate: string,
  ): Promise<DeviceGroupNextIssueCertificate> {
    this.logger.verbose(`With in updateCertificateIssueDate`);
    const deviceGroupDate = await this.getGroupCertificateIssueDate({
      id: id,
    });
    let updatedIssueDate = new DeviceGroupNextIssueCertificate();
    if (deviceGroupDate) {
      deviceGroupDate.start_date = startDate;
      deviceGroupDate.end_date = endDate;
      updatedIssueDate =
        await this.repositoryNextDeviceGroupCertificate.save(deviceGroupDate);
    }
    return updatedIssueDate;
  }

  async endReservationGroup(
    groupId: number,
    organizationId: number,
    reservationDate: EndReservationDateDTO,
    group?: DeviceGroupDTO | DeviceGroup,
    deviceGroupIssueNextDateDTO?: DeviceGroupNextIssueCertificate,
  ): Promise<void> {
    this.logger.verbose(`With in EndReservationGroup`);
    if (!group) group = await this.findDeviceGroupById(groupId, organizationId);

    if (
      new Date(group?.reservationEndDate).getTime() ===
      new Date(reservationDate.endresavationdate).getTime()
    ) {
      if (!deviceGroupIssueNextDateDTO)
        deviceGroupIssueNextDateDTO = await this.getGroupCertificateIssueDate({
          groupId: groupId,
        });

      this.endReservation(
        groupId,
        group as DeviceGroup,
        deviceGroupIssueNextDateDTO,
      );
      return;
    }
  }

  async endReservation(
    groupId: number,
    group: DeviceGroup,
    deviceGroupIssueNextDateDTO: DeviceGroupNextIssueCertificate,
  ): Promise<void> {
    this.logger.verbose(`With in endReservation`);
    if (group) {
      group.reservationActive = false;
      await this.repository.save(group);
    }

    await this.repositoryNextDeviceGroupCertificate.delete(
      deviceGroupIssueNextDateDTO.id,
    );
    const devices = await this.deviceService.findForGroup(groupId);

    if (!devices?.length) {
      return;
    }

    await Promise.all(
      devices.map(async (device: any) => {
        await this.deviceService.removeFromGroup(device.id, groupId);
      }),
    );
    return;
  }

  async deactivateReservation(group: DeviceGroup): Promise<void> {
    this.logger.verbose(`With in deactivateReservation`);
    if (group) {
      group.reservationActive = false;
      await this.repository.save(group);
      return;
    }
  }

  public async getDeviceGrouplog(
    groupId: number,
  ): Promise<CheckCertificateIssueDateLogForDeviceGroupEntity[] | undefined> {
    this.logger.verbose(`With in getDeviceGrouplog`);
    return this.checkDeviceGroupLogCertificateRepository.find({
      where: {
        groupid: groupId.toString(),
      },
    });
  }

  public async addCertificateIssueDateLogForDeviceGroup(
    params: CheckCertificateIssueDateLogForDeviceGroupEntity,
  ): Promise<CheckCertificateIssueDateLogForDeviceGroupEntity> {
    this.logger.verbose(`With in AddCertificateIssueDateLogForDeviceGroup`);
    return await this.checkDeviceGroupLogCertificateRepository.save({
      ...params,
    });
  }

  public async getNextHistoryIssuanceDeviceLog(): Promise<
    HistoryDeviceGroupNextIssueCertificate[] | undefined
  > {
    this.logger.verbose(`With in getNextHistoryIssuanceDeviceLog`);
    return this.historyNextIssuanceDateRepository.find({
      where: {
        status: HistoryNextIssuanceStatus.Pending,
      },
    });
  }

  public async countGroupIdHistoryIssuanceDeviceLog(
    groupId: number,
  ): Promise<number> {
    this.logger.verbose(`With in countGroupIdHistoryIssuanceDeviceLog`);
    return await this.historyNextIssuanceDateRepository.count({
      where: {
        groupId: groupId,
        status: 'Pending',
      },
    });
  }

  public async getNextHistoryIssuanceDeviceLogAfterReservation(
    developerExternalId: string,
    groupId: number,
  ): Promise<HistoryDeviceGroupNextIssueCertificate | undefined> {
    this.logger.verbose(
      `With in getNextHistoryIssuanceDeviceLogAfterReservation`,
    );
    return await this.historyNextIssuanceDateRepository.findOne({
      where: {
        device_externalid: developerExternalId,
        groupId: groupId,
        status: 'Completed',
      },
    });
  }

  async getHistoryCertificateIssueDate(
    conditions: FindConditions<HistoryDeviceGroupNextIssueCertificate>,
  ): Promise<HistoryDeviceGroupNextIssueCertificate | null> {
    this.logger.verbose(`With in getHistoryCertificateIssueDate`);
    return (
      (await this.historyNextIssuanceDateRepository.findOne(conditions)) ?? null
    );
  }
  async updateHistoryCertificateIssueDate(
    id: number,
    Status: HistoryNextIssuanceStatus,
  ): Promise<HistoryDeviceGroupNextIssueCertificate> {
    this.logger.verbose(`With in updateHistoryCertificateIssueDate`);
    const historyNextDate = await this.getHistoryCertificateIssueDate({
      id: id,
    });
    let updatedIssueDateStatus = new HistoryDeviceGroupNextIssueCertificate();
    if (historyNextDate) {
      historyNextDate.status = Status;
      updatedIssueDateStatus =
        await this.historyNextIssuanceDateRepository.save(historyNextDate);
    }
    return updatedIssueDateStatus;
  }

  async getAllReservationActive(): Promise<DeviceGroup[]> {
    this.logger.verbose(`With in getallReservationactive`);
    return await this.repository.find({
      where: {
        reservationActive: true,
      },
    });
  }

  async getCurrentInformationOfDevicesInReservation(
    groupId: string,
    pageNumber?: number,
  ): Promise<any> {
    this.logger.verbose(`With in getcurrentInformationOfDevicesInReservation`);
    const group = await this.findOne({
      devicegroup_uid: groupId,
      reservationActive: true,
    });
    if (group === null) {
      this.logger.error(`Reservation expired`);
      throw new ConflictException({
        success: false,
        message: 'Reservation expired',
      });
    }
    await this.deviceService.findByIds(group.deviceIdsInt);
    const deviceHistoryNextIssuance = [];
    if (pageNumber === undefined || pageNumber === null) {
      pageNumber = 1;
    }
    const pageSize = 10;
    const skip = (pageNumber - 1) * pageSize;
    const queryBuilder = await this.historyNextIssuanceDateRepository
      .createQueryBuilder('hni')
      .leftJoin('device', 'd', 'hni.device_externalid = d.externalId')
      .select([
        'd.developerExternalId AS "externalId"',
        'hni.* AS historynextissuance',
      ])
      .where('hni.groupId = :groupId', { groupId: group.id })
      .offset(skip)
      .limit(pageSize);

    const count = await queryBuilder.getCount();

    const historyNextIssuance = await queryBuilder.getRawMany();

    historyNextIssuance.forEach((element) => {
      element.device_externalid = element.externalId;
      delete element['createdAt'];
      delete element['groupId'];
      delete element['id'];
      delete element['updatedAt'];
    });
    deviceHistoryNextIssuance.push({
      historyNextIssuance,
    });

    const allIssuance: any = [];

    deviceHistoryNextIssuance.forEach((ele) =>
      ele.historyNextIssuance.forEach((he) => allIssuance.push(he)),
    );

    const totalPages = Math.ceil(count / pageSize);
    const nextIssuance: any =
      (await this.repositoryNextDeviceGroupCertificate.findOne({
        where: {
          groupId: group.id,
        },
      })) ?? null;

    return {
      historynextissuansinfo: {
        AllDeviceshistnextissuansinfo: allIssuance,
        totalItems: count,
        currentPage: pageNumber,
        totalPages: totalPages,
      },
      ongoing_next_issuance: nextIssuance,
    };
  }

  async getReservationInforDeveloperBsise(
    orgId: number,
    role: Role,
    filterDTO: FilterDTO,
    pageNumber: number,
    apiUserId?: string,
  ): Promise<any> {
    this.logger.verbose(`With in getReservationInforDeveloperBsise`);
    const pageSize = 10;
    if (pageNumber <= 0) {
      this.logger.error(`Invalid page number`);
      throw new HttpException('Invalid page number', HttpStatus.BAD_REQUEST);
    }
    const skip = (pageNumber - 1) * pageSize;

    const queryBuilder: any = this.repository
      .createQueryBuilder('dg')
      .innerJoin(Device, 'd', 'd.id = ANY(dg.deviceIdsInt)')
      .innerJoin(
        CheckCertificateIssueDateLogForDeviceGroupEntity,
        'dg_log',
        'dg_log.groupId = dg.id',
      )
      .innerJoin(
        CertificateReadModelEntity,
        'crm',
        "dg_log.certificateTransactionUID = (crm.metadata::jsonb)->>'certificateTransactionUID'",
      )
      .select(
        'DISTINCT ON (dg.id, crm.internalCertificateId) dg.id AS deviceGroupId, dg.name, dg.deviceIdsInt, d.*, dg_log.readvalue_watthour, crm.internalCertificateId',
      )
      .orderBy(
        'dg.id, crm.internalCertificateId, dg_log.readvalue_watthour',
        'ASC',
      );

    queryBuilder.where((qb) => {
      let whereOrganizationId: any;
      if (role === 'OrganizationAdmin') {
        whereOrganizationId = qb.where(`d.organizationId = :orgId`, {
          orgId: orgId,
        });
      }
      if (role === 'Buyer') {
        whereOrganizationId = qb.where(`dg.organizationId = :orgId`, {
          orgId: orgId,
        });
      }

      if (role === 'ApiUser') {
        whereOrganizationId = qb.where(`dg.api_user_id = :api_user_id`, {
          api_user_id: apiUserId,
        });
      }

      whereOrganizationId
        .andWhere(
          new Brackets((qb) => {
            qb.where(
              `EXISTS(
                SELECT 1
                FROM jsonb_array_elements_text(CAST(crm.metadata AS jsonb)->'deviceIds') AS ids(deviceId)
                WHERE
                  (ids.deviceId ~* '^[0-9]+$' AND CAST(ids.deviceId AS INTEGER) = d.id) OR
                  (ids.deviceId !~* '^[0-9]+$' AND CAST(ids.deviceId AS TEXT) = d.externalId)
              )`,
            );
          }),
        )
        .andWhere(
          new Brackets((qb) => {
            if (filterDTO.country) {
              const string = filterDTO.country;
              string.split(',');
              let CountryInvalid = false;
              filterDTO.country = filterDTO.country.toUpperCase();
              if (
                filterDTO.country &&
                typeof filterDTO.country === 'string' &&
                filterDTO.country.length === 3
              ) {
                if (
                  countryCodesList.find(
                    (ele) => ele.countryCode === filterDTO.country,
                  ) === undefined
                ) {
                  CountryInvalid = true;
                }
              }

              if (!CountryInvalid) {
                const newCountry = filterDTO.country.toString();
                const CountryArray = newCountry.split(',');
                qb.orWhere(
                  new Brackets((qb) => {
                    CountryArray.forEach((country, index) => {
                      if (index === 0) {
                        qb.where(`d.countryCode ILIKE :benefit${index}`, {
                          [`benefit${index}`]: `%${country}%`,
                        });
                      } else {
                        qb.orWhere(`d.countryCode ILIKE :benefit${index}`, {
                          [`benefit${index}`]: `%${country}%`,
                        });
                      }
                    });
                  }),
                );
              }
            }
            if (filterDTO.fuelCode) {
              const newFuelCode = filterDTO.fuelCode.toString();
              const fuelCodeArray = newFuelCode.split(',');
              qb.orWhere(
                new Brackets((qb) => {
                  fuelCodeArray.forEach((fuelCode, index) => {
                    if (index === 0) {
                      qb.where(`d.fuelCode ILIKE :benefit${index}`, {
                        [`benefit${index}`]: `%${fuelCode}%`,
                      });
                    } else {
                      qb.orWhere(`d.fuelCode ILIKE :benefit${index}`, {
                        [`benefit${index}`]: `%${fuelCode}%`,
                      });
                    }
                  });
                }),
              );
            }
            if (filterDTO.offTaker) {
              const newOffTaker = filterDTO.offTaker.toString();
              const offTakerArray = newOffTaker.split(',');
              qb.orWhere(
                new Brackets((qb) => {
                  offTakerArray.forEach((offTaker, index) => {
                    if (index === 0) {
                      qb.where(`d.offTaker ILIKE :benefit${index}`, {
                        [`benefit${index}`]: `%${offTaker}%`,
                      });
                    } else {
                      qb.orWhere(`d.offTaker ILIKE :benefit${index}`, {
                        [`benefit${index}`]: `%${offTaker}%`,
                      });
                    }
                  });
                }),
              );
            }
            const startTimestamp =
              new Date(filterDTO.start_date).getTime() / 1000;
            const endTimestamp = new Date(filterDTO.end_date).getTime() / 1000;
            if (filterDTO.start_date && filterDTO.end_date === undefined) {
              qb.orWhere('crm.generationStartTime > :certificateStartDate ', {
                certificateStartDate: startTimestamp,
              });
            }
            if (filterDTO.end_date && filterDTO.start_date === undefined) {
              qb.orWhere('crm.generationEndTime  <:certificateEndDate', {
                certificateEndDate: endTimestamp,
              });
            }
            if (filterDTO.start_date && filterDTO.end_date) {
              qb.orWhere(
                'crm.generationStartTime BETWEEN :certificateStartDate1  AND :certificateEndDate1',
                {
                  certificateStartDate1: startTimestamp,
                  certificateEndDate1: endTimestamp,
                },
              );
              qb.orWhere(
                'crm.generationEndTime BETWEEN :certificateStartDate2  AND :certificateEndDate2',
                {
                  certificateStartDate2: startTimestamp,
                  certificateEndDate2: endTimestamp,
                },
              );
            }
            if (filterDTO.SDGBenefits) {
              const newSDG = filterDTO.SDGBenefits.toString();
              const sdgBenefitsArray = newSDG.split(',');
              // sdgBenefitString
              sdgBenefitsArray.map((benefit) => benefit).join(',');
              qb.orWhere(
                new Brackets((qb) => {
                  sdgBenefitsArray.forEach((benefit, index) => {
                    if (index === 0) {
                      qb.where(`d.SDGBenefits ILIKE :benefit${index}`, {
                        [`benefit${index}`]: `%${benefit}%`,
                      });
                    } else {
                      qb.orWhere(`d.SDGBenefits ILIKE :benefit${index}`, {
                        [`benefit${index}`]: `%${benefit}%`,
                      });
                    }
                  });
                }),
              );
            }
            if (filterDTO.fromAmountread && filterDTO.toAmountread) {
              qb.orWhere(
                'dg_log.readvalue_watthour BETWEEN :fromAmountread  AND :toAmountread',
                {
                  fromAmountread: filterDTO.fromAmountread,
                  toAmountread: filterDTO.toAmountread,
                },
              );
            }
            if (
              filterDTO.fromAmountread != null &&
              filterDTO.toAmountread === undefined
            ) {
              qb.orWhere('dg_log.readvalue_watthour > :fromAmountread', {
                fromAmountread: filterDTO.fromAmountread,
              });
            }
            if (
              filterDTO.fromAmountread === undefined &&
              filterDTO.toAmountread != null
            ) {
              qb.orWhere('dg_log.readvalue_watthour < :toAmountread', {
                toAmountread: filterDTO.toAmountread,
              });
            }
          }),
        );
    });
    const totalCountQuery = await queryBuilder.getRawMany();
    const groupedData = await queryBuilder
      .offset(skip)
      .limit(pageSize)
      .getRawMany();
    const totalCount = totalCountQuery.length;
    this.logger.debug('totalCountQuery', totalCount);
    const totalPages = Math.ceil(totalCount / pageSize);
    let deviceGroups: any;
    if (role === 'OrganizationAdmin') {
      deviceGroups = groupedData.reduce((acc, curr) => {
        const existing = acc.find((item) => item.dg_id === curr.devicegroupid);

        if (existing) {
          const existingDevice = existing.developerdeviceIds.find(
            (item) => item === curr.id,
          );
          if (!existingDevice) {
            existing.developerdeviceIds.push(curr.id);
          }
          existing.internalCertificateId.push(curr.internalCertificateId);
        } else {
          acc.push({
            dg_id: curr.devicegroupid,
            name: curr.name,
            deviceIdsInt: curr.deviceIdsInt,
            developerdeviceIds: [curr.id],
            internalCertificateId: [curr.internalCertificateId],
          });
        }
        return acc;
      }, []);
    }
    if (role === 'Buyer' || role === Role.ApiUser) {
      deviceGroups = groupedData.reduce((acc, curr) => {
        const existing = acc.find((item) => item.dg_id === curr.devicegroupid);

        if (existing) {
          existing.internalCertificateId.push(curr.internalCertificateId);
        } else {
          acc.push({
            dg_id: curr.devicegroupid,
            name: curr.name,
            deviceIdsInt: curr.deviceIdsInt,
            internalCertificateId: [curr.internalCertificateId],
          });
        }
        return acc;
      }, []);
    }

    return {
      deviceGroups,
      pageNumber,
      totalPages,
      totalCount,
    };
  }
  async getFilteredDeviceGroupReservationHistoryByUserRole(
    orgId: number,
    role: Role,
    filterDTO: FilterDTO,
    pageNumber: number,
    apiUserId?: string,
  ): Promise<any> {
    this.logger.verbose(
      `With in getFilteredDeviceGroupReservationHistoryByUserRole`,
    );
    const pageSize = 10;
    // const pageNumber = 2
    if (pageNumber <= 0) {
      this.logger.error(`Invalid page number`);
      throw new HttpException('Invalid page number', HttpStatus.BAD_REQUEST);
    }

    const skip = (pageNumber - 1) * pageSize;

    const queryBuilder: any = this.repository
      .createQueryBuilder('dg')
      .innerJoin(Device, 'd', 'd.id = ANY(dg.deviceIdsInt)')
      .innerJoin(
        CheckCertificateIssueDateLogForDeviceGroupEntity,
        'dg_log',
        'dg_log.groupId = dg.id',
      )
      .innerJoin(
        Certificate,
        'issuer',
        'CAST(issuer.deviceId AS INTEGER) = dg.id',
      )
      .select(
        'DISTINCT ON (dg.id, issuer.id) dg.id AS deviceGroupId, dg.name, dg.deviceIdsInt, d.*, dg_log.readvalue_watthour, issuer.id As issuerId',
      )
      .orderBy('dg.id, issuer.id, dg_log.readvalue_watthour', 'ASC');

    queryBuilder.where((qb) => {
      let whereOrganizationId: any;
      if (role === 'OrganizationAdmin') {
        whereOrganizationId = qb.where(`d.organizationId = :orgId`, {
          orgId: orgId,
        });
      }
      if (role === 'Buyer') {
        whereOrganizationId = qb.where(`dg.organizationId = :orgId`, {
          orgId: orgId,
        });
      }
      if (role === 'ApiUser') {
        whereOrganizationId = qb.where(`dg.api_user_id = :api_user_id`, {
          api_user_id: apiUserId,
        });
      }
      whereOrganizationId
        .andWhere(
          "EXISTS(SELECT 1 FROM jsonb_array_elements_text(CAST(issuer.metadata  AS jsonb)->'deviceIds') AS ids(deviceId) WHERE CAST(ids.deviceId AS INTEGER) = d.id)",
        )
        .andWhere(
          new Brackets((qb) => {
            if (filterDTO.country) {
              const string = filterDTO.country;
              string.split(',');
              let CountryInvalid = false;
              filterDTO.country = filterDTO.country.toUpperCase();
              if (
                filterDTO.country &&
                typeof filterDTO.country === 'string' &&
                filterDTO.country.length === 3
              ) {
                if (
                  countryCodesList.find(
                    (ele) => ele.countryCode === filterDTO.country,
                  ) === undefined
                ) {
                  CountryInvalid = true;
                }
              }

              if (!CountryInvalid) {
                const newCountry = filterDTO.country.toString();
                const CountryArray = newCountry.split(',');
                qb.orWhere(
                  new Brackets((qb) => {
                    CountryArray.forEach((country, index) => {
                      if (index === 0) {
                        qb.where(`d.countryCode ILIKE :benefit${index}`, {
                          [`benefit${index}`]: `%${country}%`,
                        });
                      } else {
                        qb.orWhere(`d.countryCode ILIKE :benefit${index}`, {
                          [`benefit${index}`]: `%${country}%`,
                        });
                      }
                    });
                  }),
                );
              }
            }
            if (filterDTO.fuelCode) {
              const newFuelCode = filterDTO.fuelCode.toString();
              const fuelCodeArray = newFuelCode.split(',');
              qb.orWhere(
                new Brackets((qb) => {
                  fuelCodeArray.forEach((fuelCode, index) => {
                    if (index === 0) {
                      qb.where(`d.fuelCode ILIKE :fuelcode${index}`, {
                        [`fuelcode${index}`]: `%${fuelCode}%`,
                      });
                    } else {
                      qb.orWhere(`d.fuelCode ILIKE :fuelcode${index}`, {
                        [`fuelcode${index}`]: `%${fuelCode}%`,
                      });
                    }
                  });
                }),
              );
            }
            if (filterDTO.offTaker) {
              const newOffTaker = filterDTO.offTaker.toString();
              const offTakerArray = newOffTaker.split(',');
              qb.orWhere(
                new Brackets((qb) => {
                  offTakerArray.forEach((offTaker, index) => {
                    if (index === 0) {
                      qb.where(`d.offTaker ILIKE :offtaker${index}`, {
                        [`offtaker${index}`]: `%${offTaker}%`,
                      });
                    } else {
                      qb.orWhere(`d.offTaker ILIKE :offtaker${index}`, {
                        [`offtaker${index}`]: `%${offTaker}%`,
                      });
                    }
                  });
                }),
              );
            }
            const startTimestamp =
              new Date(filterDTO.start_date).getTime() / 1000;
            const endTimestamp = new Date(filterDTO.end_date).getTime() / 1000;
            if (filterDTO.start_date && filterDTO.end_date === undefined) {
              qb.orWhere(
                'issuer.generationStartTime > :certificateStartDate ',
                { certificateStartDate: startTimestamp },
              );
            }
            if (filterDTO.end_date && filterDTO.start_date === undefined) {
              qb.orWhere('issuer.generationEndTime  <:certificateEndDate', {
                certificateEndDate: endTimestamp,
              });
            }
            if (filterDTO.start_date && filterDTO.end_date) {
              qb.orWhere(
                'issuer.generationStartTime BETWEEN :certificateStartDate1  AND :certificateEndDate1',
                {
                  certificateStartDate1: startTimestamp,
                  certificateEndDate1: endTimestamp,
                },
              );
              qb.orWhere(
                'issuer.generationEndTime BETWEEN :certificateStartDate2  AND :certificateEndDate2',
                {
                  certificateStartDate2: startTimestamp,
                  certificateEndDate2: endTimestamp,
                },
              );
            }
            if (filterDTO.SDGBenefits) {
              const newSDG = filterDTO.SDGBenefits.toString();
              const sdgBenefitsArray = newSDG.split(',');
              //sdgBenefitString
              sdgBenefitsArray.map((benefit) => benefit).join(',');
              qb.orWhere(
                new Brackets((qb) => {
                  sdgBenefitsArray.forEach((benefit, index) => {
                    if (index === 0) {
                      qb.where(`d.SDGBenefits ILIKE :benefit${index}`, {
                        [`benefit${index}`]: `%${benefit}%`,
                      });
                    } else {
                      qb.orWhere(`d.SDGBenefits ILIKE :benefit${index}`, {
                        [`benefit${index}`]: `%${benefit}%`,
                      });
                    }
                  });
                }),
              );
            }
            if (filterDTO.fromAmountread && filterDTO.toAmountread) {
              qb.orWhere(
                'dg_log.readvalue_watthour BETWEEN :fromAmountread  AND :toAmountread',
                {
                  fromAmountread: filterDTO.fromAmountread,
                  toAmountread: filterDTO.toAmountread,
                },
              );
            }
            if (
              filterDTO.fromAmountread != null &&
              filterDTO.toAmountread === undefined
            ) {
              qb.orWhere('dg_log.readvalue_watthour > :fromAmountread', {
                fromAmountread: filterDTO.fromAmountread,
              });
            }
            if (
              filterDTO.fromAmountread === undefined &&
              filterDTO.toAmountread != null
            ) {
              qb.orWhere('dg_log.readvalue_watthour < :toAmountread', {
                toAmountread: filterDTO.toAmountread,
              });
            }
          }),
        );
    });
    const totalCountQuery = await queryBuilder.getRawMany();
    const groupedDataSQL = await queryBuilder
      .offset(skip)
      .limit(pageSize)
      .getSql();
    this.logger.debug(groupedDataSQL);
    const groupedData = await queryBuilder
      .offset(skip)
      .limit(pageSize)
      .getRawMany();
    const totalCount = totalCountQuery.length;
    this.logger.debug('totalCountQuery', totalCount);
    const totalPages = Math.ceil(totalCount / pageSize);

    let deviceGroups: any;
    if (role === 'OrganizationAdmin') {
      deviceGroups = groupedData.reduce((acc, curr) => {
        const existing = acc.find((item) => item.dg_id === curr.devicegroupid);

        if (existing) {
          const existingDevice = existing.developerdeviceIds.find(
            (item) => item === curr.id,
          );
          if (!existingDevice) {
            existing.developerdeviceIds.push(curr.id);
          }
          existing.internalCertificateId.push(curr.issuerid);
        } else {
          acc.push({
            dg_id: curr.devicegroupid,
            name: curr.name,
            deviceIdsInt: curr.deviceIdsInt,
            developerdeviceIds: [curr.id],
            internalCertificateId: [curr.issuerid],
          });
        }
        return acc;
      }, []);
    }
    if (role === 'Buyer' || role === Role.ApiUser) {
      deviceGroups = groupedData.reduce((acc, curr) => {
        const existing = acc.find((item) => item.dg_id === curr.devicegroupid);

        if (existing) {
          existing.internalCertificateId.push(curr.issuerid);
        } else {
          acc.push({
            dg_id: curr.devicegroupid,
            name: curr.name,
            deviceIdsInt: curr.deviceIdsInt,
            internalCertificateId: [curr.issuerid],
          });
        }
        return acc;
      }, []);
    }
    return {
      deviceGroups,
      pageNumber,
      totalPages,
      totalCount,
    };
  }

  public async checkDeveloperOrganization(
    deviceIds: number[],
    organizationId: number,
  ): Promise<any> {
    this.logger.verbose(`With in checkdeveloperorganization`);
    const isMyDevice = await Promise.all(
      await deviceIds.map(async (deviceId) => {
        const device = await this.deviceService.findOne(Number(deviceId));
        return device.organizationId === Number(organizationId);
      }),
    );

    return isMyDevice.some((result) => result);
  }

  async getAllCSVJobsForApiUser(
    apiUserId: string,
    organizationId?: number,
    pageNumber?: number,
    limit?: number,
  ): Promise<
    | {
        csvJobs: Array<DeviceCsvFileProcessingJobsEntity>;
        currentPage: number;
        totalPages: number;
        totalCount: number;
      }
    | any
  > {
    this.logger.verbose(`With in getAllCSVJobsForApiUser`);
    const query: SelectQueryBuilder<DeviceCsvFileProcessingJobsEntity> =
      await this.repositoryCSVJobProcessing
        .createQueryBuilder('csvjobs')
        .orderBy('csvjobs.createdAt', 'DESC');

    if (apiUserId) {
      query.andWhere(`csvjobs.api_user_id = '${apiUserId}'`);
    }

    if (organizationId) {
      query.andWhere(`csvjobs.organizationId = '${organizationId}'`);
    }

    const [csvjobs, totalCount] = await query
      .skip((pageNumber - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const totalPages = Math.ceil(totalCount / limit);

    const csvJobsWithOrganization = await Promise.all(
      csvjobs.map(async (csvjob: DeviceCsvFileProcessingJobsEntity) => {
        const organization = await this.organizationService.findOne(
          csvjob.organizationId,
        );
        csvjob.organization = {
          name: organization.name,
        };
        return csvjob;
      }),
    );

    return {
      csvJobs: csvJobsWithOrganization,
      currentPage: pageNumber,
      totalPages,
      totalCount,
    };
  }
}
