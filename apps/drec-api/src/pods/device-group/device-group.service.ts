import {
  Injectable,
  NotFoundException,
  Logger,
  ConflictException,
  Inject,
  UnauthorizedException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  FindConditions,
  FindManyOptions,
  FindOperator,
  Raw,
  LessThan,
  In, Between, LessThanOrEqual, getConnection, Brackets, SelectQueryBuilder
} from 'typeorm';
import { DeviceService } from '../device/device.service';
import {
  AddGroupDTO,
  DeviceGroupDTO,
  DeviceIdsDTO,
  JobFailedRowsDTO,
  NewDeviceGroupDTO,
  ReserveGroupsDTO,
  SelectableDeviceGroupDTO,
  UnreservedDeviceGroupsFilterDTO,
  UpdateDeviceGroupDTO,
  EndReservationdateDTO,
  NewUpdateDeviceGroupDTO,
  ResponseDeviceGroupDTO
} from './dto';
//import { jsonbBuildObject, jsonbBuildArray, jsonbPath, jsonbArrayElements } from 'typeorm-plus';
import { defaults, cloneDeep } from 'lodash';
import { DeviceGroup } from './device-group.entity';
import { Device } from '../device/device.entity';
import { DeviceDescription, IDevice, BuyerReservationCertificateGenerationFrequency } from '../../models';
import { DeviceDTO, NewDeviceDTO, FilterDTO } from '../device/dto';
import {
  CommissioningDateRange,
  Installation,
  OffTaker,
  Sector,
  StandardCompliance,
  FuelCode,
  DevicetypeCode,
  SingleDeviceIssuanceStatus,
  ReadType,
  Role
} from '../../utils/enums';

import moment from 'moment';

import { groupByProps } from '../../utils/group-by-properties';
import { getCapacityRange } from '../../utils/get-capacity-range';
import { getDateRangeFromYear } from '../../utils/get-commissioning-date-range';
import cleanDeep from 'clean-deep';
import { OrganizationService } from '../organization/organization.service';
import { getFuelNameFromCode } from '../../utils/getFuelNameFromCode';
import { nanoid } from 'nanoid';
import { HistoryNextInssuanceStatus } from '../../utils/enums/history_next_issuance.enum'
import { Cron, CronExpression } from '@nestjs/schedule';
import { DeviceCsvProcessingFailedRowsEntity } from './device_csv_processing_failed_rows.entity';
import {
  DeviceCsvFileProcessingJobsEntity,
  StatusCSV,
} from './device_csv_processing_jobs.entity';
import { DeviceGroupNextIssueCertificate } from './device_group_issuecertificate.entity';
import { Readable } from 'stream';
import csv from 'csv-parser';

import csvtojsonV2 from "csvtojson";

import { countryCodesList } from '../../models/country-code'

import { File, FileService } from '../file';
import { ILoggedInUser, LoggedInUser } from '../../models';
import {
  validate,
  validateOrReject,
  Contains,
  IsInt,
  Length,
  IsEmail,
  IsFQDN,
  IsDate,
  Min,
  Max,
} from 'class-validator';
import { YieldConfigService } from '../yield-config/yieldconfig.service';
import { NewfindLatestRead } from '../../utils/get-lastread-influx';
import { DateTime } from 'luxon';
import { CheckCertificateIssueDateLogForDeviceGroupEntity } from './check_certificate_issue_date_log_for_device_group.entity'
import { HistoryDeviceGroupNextIssueCertificate } from './history_next_issuance_date_log.entity';
import { SdgBenefit } from '../sdgbenefit/sdgbenefit.entity';
import { isValidUTCDateFormat } from '../../utils/checkForISOStringFormat';
import { ReadsService } from '../reads/reads.service';
import { ICertificateReadModel } from '@energyweb/origin-247-certificate';
import { CertificateReadModelEntity } from '@energyweb/origin-247-certificate/dist/js/src/offchain-certificate/repositories/CertificateReadModel/CertificateReadModel.entity';
import { CheckCertificateIssueDateLogForDeviceEntity } from '../device/check_certificate_issue_date_log_for_device.entity'
import { Certificate } from '@energyweb/issuer-api';
import { UserService } from '../user/user.service';



@Injectable()
export class DeviceGroupService {
  csvParser = csv({ separator: ',' });
  private readonly logger = new Logger(DeviceGroupService.name);

  constructor(
    @InjectRepository(DeviceCsvProcessingFailedRowsEntity)
    private readonly repositoryJobFailedRows: Repository<DeviceCsvProcessingFailedRowsEntity>,
    @InjectRepository(DeviceCsvFileProcessingJobsEntity)
    private readonly repositoyCSVJobProcessing: Repository<DeviceCsvFileProcessingJobsEntity>,
    @InjectRepository(DeviceGroup)
    private readonly repository: Repository<DeviceGroup>,
    @InjectRepository(DeviceGroupNextIssueCertificate)
    private readonly repositorynextDeviceGroupcertificate: Repository<DeviceGroupNextIssueCertificate>,
    private organizationService: OrganizationService,
    private deviceService: DeviceService,
    private readonly fileService: FileService,
    private yieldConfigService: YieldConfigService,
    @InjectRepository(CheckCertificateIssueDateLogForDeviceGroupEntity)
    private readonly checkdevciegrouplogcertificaterepository: Repository<CheckCertificateIssueDateLogForDeviceGroupEntity>,
    @InjectRepository(HistoryDeviceGroupNextIssueCertificate)
    private readonly historynextissuancedaterepository: Repository<HistoryDeviceGroupNextIssueCertificate>,
    @InjectRepository(CertificateReadModelEntity) private readonly cretificatereadmoduleRepository,
    private readonly userService: UserService,

  ) { }

  async getAll(user?: ILoggedInUser, organizationId?: number, apiuserId?: string, pageNumber?: number, limit?: number,  filterDto?: UnreservedDeviceGroupsFilterDTO ): Promise<{ devicegroups: DeviceGroupDTO[], currentPage: number, totalPages: number, totalCount: number } | any> {
    console.log("With in dg service", filterDto);
    let query : SelectQueryBuilder<DeviceGroup> = await this.repository
      .createQueryBuilder('group')
      .innerJoin(Device, 'device', 'device.id = ANY("group"."deviceIdsInt")')
      .addSelect('ARRAY_AGG(device."SDGBenefits")', 'sdgBenefits')
      .orderBy('group.createdAt', 'DESC')
      .groupBy('group.id');
 
    if(apiuserId) {
      console.log("when it has apiuserId")
      if(user.role  === Role.Admin && apiuserId === user.api_user_id) {
        query.andWhere(`group.api_user_id IS NULL`);
      }
      else {
        query.andWhere(`group.api_user_id = '${apiuserId}'`);
      }
      console.log("after query")
    }
 
    if(organizationId) {
      query.andWhere(`group.organizationId = '${organizationId}'`);
    }

    if(filterDto) {
      if (filterDto.start_date != undefined && filterDto.end_date != undefined) {
        if ((filterDto.start_date != null && filterDto.end_date === null)) {
          return new Promise((resolve, reject) => {
            reject(new ConflictException({
              success: false,
              message: `End date should be if in filter query you used with Start date `,
            }))
          })
        }
        console.log((new Date(filterDto.start_date).getTime() < new Date(filterDto.end_date).getTime()))
        console.log(filterDto.end_date)
        console.log(new Date(filterDto.start_date).getTime())

        if (!(new Date(filterDto.start_date).getTime() < new Date(filterDto.end_date).getTime())) {
          return new Promise((resolve, reject) => {
            reject(new ConflictException({
              success: false,
              message: `End date should be greater then from Start date `,
            }))
          })
        }

        if (!(new Date(filterDto.start_date).getTime() < new Date(filterDto.end_date).getTime())) {
          return new Promise((resolve, reject) => {
            reject(new ConflictException({
              success: false,
              message: `End date should be greater then from Start date `,
            }))
          })
        }
      }

      if(filterDto.country) {
        const countrystr = filterDto.country;
        console.log("country string:", countrystr);
        const values = countrystr.split(",");
        console.log("Values:", values);
        let invalidCountry = false;
        values.forEach(element => {
          console.log("elem:",element);
          filterDto.country = element.toUpperCase();
          console.log('filterDto:', filterDto.country)
          if(filterDto.country && typeof(filterDto.country) === 'string' && filterDto.country.length === 3) {
            let countries = countryCodesList;
            console.log("Countries:", countries);
            console.log("Element:", element);
            if(countries.find(element => element.countryCode === filterDto.country) === undefined) {
              invalidCountry = true;
            }
          }
        });

        console.log("IsValidCountry:", invalidCountry);

        if(!invalidCountry) {
          console.log("Values of:", values);
          query.andWhere('group.countryCode @> ARRAY[:...countryCodes]', { countryCodes: values});
        }
      }

      if(filterDto.fuelCode) {
        console.log("when query for fuelCode:", filterDto.fuelCode)
        if (typeof filterDto.fuelCode === 'string') {
          console.log(typeof filterDto.fuelCode);
          query.andWhere('group.fuelCode = :fuelcode', { fuelcode: [filterDto.fuelCode] });
        } else if (typeof filterDto.fuelCode === 'object') {
          console.log(JSON.stringify(filterDto.fuelCode));
          query.andWhere('group.fuelCode @> ARRAY[:...fuelcode]', { fuelcode: filterDto.fuelCode })
        }
      }

      if(filterDto.offTaker) {
        const newoffTaker = filterDto.offTaker.toString();
        const offTakerArray = newoffTaker.split(',');
        console.log("OfftakerArray:",offTakerArray);
        query.andWhere(new Brackets(qb => {

          offTakerArray.forEach((offTaker, index) => {
            if (index === 0) {
              qb.orWhere(`EXISTS (SELECT 1 FROM unnest(group.offTakers) ot WHERE ot LIKE :offtaker${index})`, { [`offtaker${index}`]: `%${offTaker}%` });

            } else {
              qb.orWhere(`EXISTS (SELECT 1 FROM unnest(group.offTakers) ot WHERE ot LIKE :offtaker${index})`, { [`offtaker${index}`]: `%${offTaker}%` });

            }
          });
        }));      
      }
      
      if (filterDto.start_date && filterDto.end_date) {
        query.andWhere(new Brackets((db) => {
          db.where(
            new Brackets((db1) => {
              db1.where("group.reservationStartDate BETWEEN :reservationStartDate1  AND :reservationEndDate1", { reservationStartDate1: filterDto.start_date, reservationEndDate1: filterDto.end_date })
                .orWhere("group.reservationStartDate = :reservationStartDate", { reservationStartDate: filterDto.start_date })
            })
          )
            .andWhere(
              new Brackets((db2) => {
                db2.where("group.reservationEndDate  BETWEEN :reservationStartDate2  AND :reservationEndDate2", { reservationStartDate2: filterDto.start_date, reservationEndDate2: filterDto.end_date })
                  .orWhere("group.reservationEndDate = :reservationStartDate ", { reservationStartDate: filterDto.end_date })
              })
            )
        }))
      }

      if(filterDto.sdgbenefit) {
        const sdgstr = filterDto.sdgbenefit.toString();
        const sdgBenefitsArray = sdgstr.split(',');
        query.andWhere(new Brackets(qb => {
          sdgBenefitsArray.forEach((benefit, index) => {
            if (index === 0) {
              qb.where(`device.SDGBenefits ILIKE :benefit${index}`, { [`benefit${index}`]: `%${benefit}%` });
            } else {
              qb.orWhere(`device.SDGBenefits ILIKE :benefit${index}`, { [`benefit${index}`]: `%${benefit}%` });
            }
          });
        }))
      }

      if (filterDto.reservationActive) {
        if (filterDto.reservationActive === 'Active') {
          query.andWhere('group.reservationActive = :active', { active: true });
        }
        if (filterDto.reservationActive === 'Deactive') {
          query.andWhere('group.reservationActive = :active', { active: false });
        }
      }
    }

    console.log("Query before")
    const [groups, totalCount] = await query
        .skip((pageNumber - 1) * limit)
        .take(limit)
        .getManyAndCount();
    console.log('group:',groups)
        const totalPages = Math.ceil(totalCount / limit);
 
    console.log("groups:", groups);
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
      devicegroups: groupsWithOrganization,
      currentPage: pageNumber,
      totalPages,
      totalCount
    }
  }

  async findById(id: number, user?: ILoggedInUser): Promise<DeviceGroupDTO> {
    const deviceGroup = await this.repository.findOne({
      id,
    });
    if (!deviceGroup) {
      throw new NotFoundException(`No device group found with id ${id}`);
    }
    if(user) {
      if(user.role === Role.ApiUser) { 
        const organization = await this.organizationService.findOne(user.organizationId);
        const orguser = await this.userService.findByEmail(organization.orgEmail);
        if(orguser.role === Role.OrganizationAdmin || orguser.role === Role.DeviceOwner) {
          const isMyDevice = await this.checkdeveloperorganization(deviceGroup.deviceIdsInt, user.organizationId);
          if(!isMyDevice) {
            throw new UnauthorizedException({
              success: false,
              message: `Unauthorized to view the reservation of other's devices`,
            });
          }
        }
        else if(orguser.role === Role.Buyer || orguser.role === Role.SubBuyer) {
          if(deviceGroup.organizationId != user.organizationId) {
             throw new UnauthorizedException({
              success: false,
              message: `Unauthorized to view the reservation of other organizations`,
            });
          }
        }
  
      }
      
      else {
        if(user.role === Role.OrganizationAdmin || user.role === Role.DeviceOwner) {
          const isMyDevice = await this.checkdeveloperorganization(deviceGroup.deviceIdsInt, user.organizationId);
          if(!isMyDevice) {
            throw new UnauthorizedException({
              success: false,
              message: `Unauthorized to view the reservation of other's devices`,
            });
          }
        }
        else if(user.role === Role.Buyer || user.role === Role.SubBuyer) {
          if(deviceGroup.organizationId != user.organizationId) {
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
    groupfilterDto?: UnreservedDeviceGroupsFilterDTO,

  ): Promise<any> {
    console.log(groupfilterDto);
    let deviceGroups: any;
    let queryBuilder: any;
    const pageSize = 10;
    console.log(Object.keys(groupfilterDto).length);
    if (!groupfilterDto || Object.keys(groupfilterDto).length === 0) {

      queryBuilder = this.repository
        .createQueryBuilder('dg')
        .innerJoin(Device, 'd', 'd.id = ANY(dg."deviceIdsInt")')
        .addSelect('ARRAY_AGG(d."SDGBenefits")', 'sdgBenefits')
        .orderBy('dg.id', 'ASC')
        .groupBy('dg.id')
      queryBuilder.where((qb) => {
        qb.where(`dg.buyerId = :buyerid `, {
          buyerid: buyerId
        })
      });
    }
    else {
      const skip = (pageNumber - 1) * pageSize;
      if (groupfilterDto.start_date != undefined && groupfilterDto.end_date != undefined) {
        if ((groupfilterDto.start_date != null && groupfilterDto.end_date === null)) {
          return new Promise((resolve, reject) => {
            reject(new ConflictException({
              success: false,
              message: `End date should be if in filter query you used with Start date `,
            }))
          })
        }
        console.log((new Date(groupfilterDto.start_date).getTime() < new Date(groupfilterDto.end_date).getTime()))
        console.log(groupfilterDto.end_date)
        console.log(new Date(groupfilterDto.start_date).getTime())

        if (!(new Date(groupfilterDto.start_date).getTime() < new Date(groupfilterDto.end_date).getTime())) {
          return new Promise((resolve, reject) => {
            reject(new ConflictException({
              success: false,
              message: `End date should be greater then from Start date `,
            }))
          })
        }
      }
      console.log("187")
      console.log(buyerId)
      queryBuilder = this.repository
        .createQueryBuilder('dg')
        .innerJoin(Device, 'd', 'd.id = ANY(dg."deviceIdsInt")')
        .addSelect('ARRAY_AGG(d."SDGBenefits")', 'sdgBenefits')
        .orderBy('dg.id', 'ASC')
        .groupBy('dg.id')

      queryBuilder.where((qb) => {
        qb.where(`dg.buyerId = :buyerid `, {
          buyerid: buyerId
        })
          .andWhere(new Brackets(qb => {

            if (groupfilterDto.country) {
              const string = groupfilterDto.country;
              const values = string.split(",");
              console.log(values);
              let CountryInvalid = false;
              values.forEach(ele => {
                groupfilterDto.country = ele.toUpperCase();
                if (groupfilterDto.country && typeof groupfilterDto.country === "string" && groupfilterDto.country.length === 3) {
                  let countries = countryCodesList;
                  if (countries.find(ele => ele.countryCode === groupfilterDto.country) === undefined) {
                    CountryInvalid = true;
                  }
                }
              });
              console.log(CountryInvalid)
              if (!CountryInvalid) {

                qb.orWhere('dg.countryCode @> ARRAY[:...countrycode]', { countrycode: values })

              }
            }
            if ((groupfilterDto.fuelCode)) {
              console.log(groupfilterDto.fuelCode);
              if (typeof groupfilterDto.fuelCode === 'string') {
                console.log(typeof groupfilterDto.fuelCode);
                qb.orWhere('dg.fuelCode = :fuelcode', { fuelcode: [groupfilterDto.fuelCode] });
              } else if (typeof groupfilterDto.fuelCode === 'object') {
                console.log(JSON.stringify(groupfilterDto.fuelCode));
                qb.orWhere('dg.fuelCode @> ARRAY[:...fuelcode]', { fuelcode: groupfilterDto.fuelCode })
              }
            }
            if (groupfilterDto.offTaker) {
              console.log(typeof groupfilterDto.offTaker)
              console.log(groupfilterDto.offTaker)
              const newoffTaker = groupfilterDto.offTaker.toString()
              console.log(typeof newoffTaker)
              const offTakerArray = newoffTaker.split(',');
              qb.orWhere(new Brackets(qb => {

                offTakerArray.forEach((offTaker, index) => {
                  if (index === 0) {
                    qb.orWhere(`EXISTS (SELECT 1 FROM unnest(dg.offTakers) ot WHERE ot LIKE :offtaker${index})`, { [`offtaker${index}`]: `%${offTaker}%` });

                  } else {
                    qb.orWhere(`EXISTS (SELECT 1 FROM unnest(dg.offTakers) ot WHERE ot LIKE :offtaker${index})`, { [`offtaker${index}`]: `%${offTaker}%` });

                  }
                });
              }));
            }
            // if (groupfilterDto.start_date) {

            //   qb.orWhere("dg.reservationStartDate BETWEEN :reservationStartDate1  AND :reservationEndDate1", { reservationStartDate1: groupfilterDto.start_date, reservationEndDate1: groupfilterDto.end_date })
            // }
            // if (groupfilterDto.end_date) {
            //   qb.orWhere("dg.reservationEndDate  BETWEEN :reservationStartDate2  AND :reservationEndDate2", { reservationStartDate2: groupfilterDto.start_date, reservationEndDate2: groupfilterDto.end_date })
            // }
            if (groupfilterDto.start_date && groupfilterDto.end_date) {
              qb.orWhere(new Brackets((db) => {
                db.where(
                  new Brackets((db1) => {
                    db1.where("dg.reservationStartDate BETWEEN :reservationStartDate1  AND :reservationEndDate1", { reservationStartDate1: groupfilterDto.start_date, reservationEndDate1: groupfilterDto.end_date })
                      .orWhere("dg.reservationStartDate = :reservationStartDate", { reservationStartDate: groupfilterDto.start_date })
                  })
                )
                  .andWhere(
                    new Brackets((db2) => {
                      db2.where("dg.reservationEndDate  BETWEEN :reservationStartDate2  AND :reservationEndDate2", { reservationStartDate2: groupfilterDto.start_date, reservationEndDate2: groupfilterDto.end_date })
                        .orWhere("dg.reservationEndDate = :reservationStartDate ", { reservationStartDate: groupfilterDto.end_date })
                    })
                  )
              }))
            }

            if (groupfilterDto.sdgbenefit) {
              console.log(groupfilterDto.sdgbenefit);

              const newsdg = groupfilterDto.sdgbenefit.toString()
              console.log(typeof newsdg)

              const sdgBenefitsArray = newsdg.split(',');

              const sdgBenefitString = sdgBenefitsArray.map((benefit) => benefit).join(',');
              console.log(sdgBenefitString);

              qb.orWhere(new Brackets(qb => {
                sdgBenefitsArray.forEach((benefit, index) => {
                  if (index === 0) {
                    qb.where(`d.SDGBenefits ILIKE :benefit${index}`, { [`benefit${index}`]: `%${benefit}%` });
                  } else {
                    qb.orWhere(`d.SDGBenefits ILIKE :benefit${index}`, { [`benefit${index}`]: `%${benefit}%` });
                  }
                });
              }));

            }
            if (groupfilterDto.reservationActive) {
              if (groupfilterDto.reservationActive === 'Active') {
                qb.orWhere('dg.reservationActive = :active', { active: true });
              }
              if (groupfilterDto.reservationActive === 'Deactive') {
                qb.orWhere('dg.reservationActive = :active', { active: false });
              }
            }

          }));
      })
      const groupedDatasql = await queryBuilder.getSql();
    }

    const skip = (pageNumber - 1) * pageSize;
    console.log("skip", skip)
    let groupedData = await queryBuilder.offset(skip).limit(pageSize).getRawMany();
    console.log(queryBuilder.getSql());
    // console.log(groupedData);
    const totalCountQuery = await queryBuilder
      .getCount()

    console.log("totalCountQuery", totalCountQuery);
    const totalPages = Math.ceil(totalCountQuery / pageSize);
    console.log("totalPages", totalPages);
    if (totalCountQuery > 0) {
      if (pageNumber > totalPages) {
        throw new HttpException('Page number out of range', HttpStatus.NOT_FOUND);
      }
    }

    console.log(Array.isArray(deviceGroups))
    // If deviceGroups is not an array, return an empty array
    const finalreservation = groupedData.map((deviceGroup) => ({
      id: deviceGroup.dg_id,
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
      targetVolumeCertificateGenerationRequestedInMegaWattHour: deviceGroup.dg_targetVolumeCertificateGenerationRequestedInMegaWattHour,
      targetVolumeCertificateGenerationSucceededInMegaWattHour: deviceGroup.dg_targetVolumeCertificateGenerationSucceededInMegaWattHour,
      targetVolumeCertificateGenerationFailedInMegaWattHour: deviceGroup.dg_targetVolumeCertificateGenerationFailedInMegaWattHour,
      authorityToExceed: deviceGroup.dg_authorityToExceed,
      leftoverReadsByCountryCode: deviceGroup.dg_leftoverReadsByCountryCode,
      devicegroup_uid: deviceGroup.dg_devicegroup_uid,
      type: deviceGroup.dg_type,
      deviceIds: deviceGroup.dg_deviceIdsInt,
      SDGBenefits: Array.from(new Set(deviceGroup.sdgBenefits))

    }));
    const response = {
      groupedData: finalreservation,
      pageNumber,
      totalPages,
      totalCount: totalCountQuery
    };
    return response;
  }

  async findOne(
    conditions: FindConditions<DeviceGroup>,
  ): Promise<DeviceGroup | null> {
    return (await this.repository.findOne(conditions)) ?? null;
  }


  async createCSVJobForFile(
    userId: number,
    organizationId: number,
    status: StatusCSV,
    fileId: string,
    api_user_id?: string,
  ): Promise<DeviceCsvFileProcessingJobsEntity> {

    return await this.repositoyCSVJobProcessing.save({
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
  ): Promise<{ csvJobs: Array<DeviceCsvFileProcessingJobsEntity>, currentPage: number, totalPages: number, totalCount: number } | any> {

    const [csvjobs, totalCount] = await this.repositoyCSVJobProcessing.findAndCount({
      where: { organizationId },
      order: {
        createdAt: 'DESC',
      },
      skip: (pageNumber - 1) * limit,
      take: limit
    });

    const totalPages = Math.ceil(totalCount / limit);
 
    const csvjobsWithOrganization = await Promise.all(
      csvjobs.map(async (csvjob: DeviceCsvFileProcessingJobsEntity) => {
        const organization = await this.organizationService.findOne(
          csvjob.organizationId,
        );
        //@ts-ignore
        csvjob.organization = {
          name: organization.name,
        };
        return csvjob;
      }),
    );
 
    return {
      csvJobs: csvjobsWithOrganization,
      currentPage: pageNumber,
      totalPages,
      totalCount
    }
  }
  async getAllCSVJobsForAdmin(
    orgId?: number,
    pageNumber?: number,
    limit?: number,
  ): Promise<{ csvJobs: Array<DeviceCsvFileProcessingJobsEntity>, currentPage: number, totalPages: number, totalCount: number } | any> {

    let whereConditions: any = {};

    if (orgId) {
      whereConditions.organizationId = orgId;
    }

    const [csvjobs, totalCount] = await this.repositoyCSVJobProcessing.findAndCount({
      where : whereConditions,
      order: {
        createdAt: 'DESC',
      },
      skip: (pageNumber - 1) * limit,
      take: limit
    });

    const totalPages = Math.ceil(totalCount / limit);
 
    const csvjobsWithOrganization = await Promise.all(
      csvjobs.map(async (csvjob: DeviceCsvFileProcessingJobsEntity) => {
        const organization = await this.organizationService.findOne(
          csvjob.organizationId,
        );
        //@ts-ignore
        csvjob.organization = {
          name: organization.name,
        };
        return csvjob;
      }),
    );
 
    return {
      csvJobs: csvjobsWithOrganization,
      currentPage: pageNumber,
      totalPages,
      totalCount
    }
  }
  async createFailedRowDetailsForCSVJob(
    jobId: number,
    errorDetails: Array<any>,
    successfullyAddedRowsAndExternalIds: Array<{ rowNumber: number, externalId: string }>
  ): Promise<DeviceCsvProcessingFailedRowsEntity | undefined> {
    return await this.repositoryJobFailedRows.save({
      jobId,
      errorDetails: { log: { errorDetails, successfullyAddedRowsAndExternalIds } }
    });
  }

  async getFailedRowDetailsForCSVJob(
    jobId: number,
    organizationId?: number,
  ): Promise<JobFailedRowsDTO | undefined> {

    if(organizationId) {
      const csvjob = await this.repositoyCSVJobProcessing.findOne({
        jobId: jobId,
        organizationId: organizationId,
      });

      if(!csvjob) {
        throw new UnauthorizedException({
          success: false,
          message:`The job requested is belongs to other organization`
        });
      }
    }

    return await this.repositoryJobFailedRows.findOne({
      jobId: jobId,
    });
  }

  async create(
    organizationId: number,
    data: NewDeviceGroupDTO,
    fromBulk = false,
  ): Promise<DeviceGroupDTO> {
    const groupName =
      (await this.checkNameConflict(data.name, fromBulk)) || data.name;
    const group = await this.repository.save({
      organizationId,
      ...data,
      name: groupName,
    });
    const devices = await this.deviceService.findByIds(data.deviceIds);
    let reservationIsStartingInHistoryForAtleastOneDevice: boolean = false;
    let allDevicesHaveHistoricalIssuanceAndNoNextIssuance: boolean = false;
    devices.filter(ele => {
      if ((new Date(data.reservationStartDate).getTime() < new Date(ele.createdAt).getTime()) && (new Date(data.reservationEndDate).getTime() <= new Date(ele.createdAt).getTime())) {

        return true;
      }
    }).length === devices.length ? (allDevicesHaveHistoricalIssuanceAndNoNextIssuance = true) : (allDevicesHaveHistoricalIssuanceAndNoNextIssuance = false);
    if (!allDevicesHaveHistoricalIssuanceAndNoNextIssuance) {
      //find minimum reservation start date for next issuance but also exclude in cron whose devices onbaorded date are greater than reservation start date
      //there will be single device which will have next issuance
      let minimumDeviceCreatedAtDate: Date = new Date(2993430403962);// future date in 2064 just to find minimum
      let minimumDeviceCreatedAtIndex: number = 0;
      devices.forEach((ele, index) => {
        let eleDate = new Date(ele.createdAt)
        if (eleDate.getTime() < minimumDeviceCreatedAtDate.getTime()) {
          minimumDeviceCreatedAtDate = eleDate;
          minimumDeviceCreatedAtIndex = index;
        }
      });
      ////console.log(minimumDeviceCreatedAtDate)
      //if minimum device created at i.e onboarded date is lesser than reservation start date then that will be next issuance start date else we take minimum 
      //as we will start issuance for next issuance for devices only whose createdAt is before next issuance start date 
      let startDate: string = '';
      if (minimumDeviceCreatedAtDate.getTime() < new Date(data.reservationStartDate).getTime()) {
        startDate = new Date(data.reservationStartDate).toISOString()
      }
      else {
        startDate = minimumDeviceCreatedAtDate.toISOString()
      }
      ////console.log(minimumDeviceCreatedAtDate)
      let hours = 1;

      const frequency = group.frequency.toLowerCase();
      if (frequency === BuyerReservationCertificateGenerationFrequency.daily) {
        hours = 1 * 24;
      } else if (frequency === BuyerReservationCertificateGenerationFrequency.monthly) {
        hours = 30 * 24;
      } else if (frequency === BuyerReservationCertificateGenerationFrequency.weekly) {
        hours = 7 * 24;
      } else if (frequency === BuyerReservationCertificateGenerationFrequency.quarterly) {
        hours = 91 * 24;
      }
      let newEndDate: string = '';
      let end_date = new Date((new Date(startDate).getTime() + (hours * 3.6e+6))).toISOString()

      if (new Date(end_date).getTime() < new Date(data.reservationEndDate).getTime()) {
        newEndDate = end_date;
      }
      else {
        newEndDate = data.reservationEndDate.toISOString();
      }
      ////console.log("newEndDate",newEndDate)
      //when there are multiple devices and there is device next to minimumCreatedAt but less than next possible end date 
      //then we consider that as end_date for next issuance else we might loose data for that particular device when next issuance frequency is added in cron
      let nextMinimumCreatedWhichIsLessThanEndDate: boolean = false;
      let nextMinimumCreatedAtString: string = '';
      devices.forEach((ele, index) => {
        if (index != minimumDeviceCreatedAtIndex) {
          if (new Date(ele.createdAt).getTime() < new Date(newEndDate).getTime()) {
            nextMinimumCreatedWhichIsLessThanEndDate = true;
            if (nextMinimumCreatedAtString === '') {
              //newEndDate
              nextMinimumCreatedAtString = new Date(ele.createdAt).toISOString();
            }
            else {
              //check if nextMinimum is not minimum then change else leave it 
              if (new Date(ele.createdAt).getTime() < new Date(nextMinimumCreatedAtString).getTime()) {
                nextMinimumCreatedAtString = new Date(ele.createdAt).toISOString();
              }
            }

          }
        }
      })
      ////console.log("nextMinimumCreatedAtString",nextMinimumCreatedAtString)
      if (nextMinimumCreatedWhichIsLessThanEndDate) {

        if (new Date(startDate).getTime() > new Date(nextMinimumCreatedAtString).getTime()) {
          newEndDate = newEndDate;
        }
        else {
          newEndDate = nextMinimumCreatedAtString;
        }
      }
      const nextgroupcrtifecateissue = this.repositorynextDeviceGroupcertificate.save({
        start_date: startDate,
        end_date: newEndDate,
        groupId: group.id
      });
    }
    await Promise.all(
      devices.map(async (device: Device) => {
        if (new Date(data.reservationStartDate).getTime() < new Date(device.createdAt).getTime()) {
          const nexthistorydevicecrtifecateissue = await this.historynextissuancedaterepository.save({
            groupId: group.id,
            device_externalid: device.externalId,
            reservationStartDate: data.reservationStartDate,
            reservationEndDate: new Date(data.reservationEndDate).getTime() < new Date(device.createdAt).getTime() ? data.reservationEndDate : device.createdAt,
            device_createdAt: device.createdAt,
            status: HistoryNextInssuanceStatus.Pending
          });
        }
        return await this.deviceService.addGroupIdToDeviceForReserving(
          device,
          group.id
        );
      }),
    );

    return group;
  }

  async createOne(
    organizationId: number,
    group: AddGroupDTO,
    buyerId?: number,
    buyerAddress?: string
  ): Promise<ResponseDeviceGroupDTO> {
    let smallHackAsEvenAfterReturnReservationGettingCreatedWillUseBoolean: boolean = false;
    let devices = await this.deviceService.findByIdsWithoutGroupIdsAssignedImpliesWithoutReservation(group.deviceIds);
    let unavailableDeviceIdsDueToAlreadyIncludedInBuyerReservation: Array<number> = [];
    devices.forEach(ele => ele.groupId != null ? unavailableDeviceIdsDueToAlreadyIncludedInBuyerReservation.push(ele.id) : "");
    devices = devices.filter(ele => ele.groupId === null);
    if (devices.length === 0) {
      smallHackAsEvenAfterReturnReservationGettingCreatedWillUseBoolean = true;
      return new Promise((resolve, reject) => {
        reject(new ConflictException({
          success: false,
          message: `Devices ${unavailableDeviceIdsDueToAlreadyIncludedInBuyerReservation.join(' , ')} are already included in buyer reservation, please add other devices`,
        }))
      })
    }
    let allDevicesAvailableforBuyerReservation: boolean = true;
    let unavailableDeviceIds: Array<number> = [];
    let unavailableDeviceIdsDueToCertificateAlreadyIssued: Array<number> = [];
    if (devices.length === 0) {
      smallHackAsEvenAfterReturnReservationGettingCreatedWillUseBoolean = true;
      return new Promise((resolve, reject) => {
        let message = '';
        if (unavailableDeviceIdsDueToAlreadyIncludedInBuyerReservation.length > 0) {
          message = message + `Devices ${unavailableDeviceIdsDueToAlreadyIncludedInBuyerReservation.join(' , ')} are already included in buyer reservation, please add other devices`;
        }
        message = message + `Devices ${unavailableDeviceIdsDueToCertificateAlreadyIssued.join(' , ')} have already certified data in that date range and please add other devices or select different date range`;
        reject(new ConflictException({
          success: false,
          message: message
        }))
      })
    }
    group.deviceIds.forEach(ele => {
      if (!devices.find(deviceSingle => deviceSingle.id === ele)) {
        allDevicesAvailableforBuyerReservation = false;
        unavailableDeviceIds.push(ele);
      }
    });
    if (!group.continueWithReservationIfOneOrMoreDevicesUnavailableForReservation) {
      if (!allDevicesAvailableforBuyerReservation) {
        smallHackAsEvenAfterReturnReservationGettingCreatedWillUseBoolean = true;
        return new Promise((resolve, reject) => {
          reject(new ConflictException({
            success: false,
            message: 'One or more devices device Ids: ' + unavailableDeviceIds.join(',') + ' are already included in buyer reservation, please add other devices',
          }))
        })
      }
    }
    if (!group.continueWithReservationIfTargetCapacityIsLessThanDeviceTotalCapacityBetweenDuration) {
      let aggregatedCapacity = 0;
      devices.forEach(ele => aggregatedCapacity = ele.capacity + aggregatedCapacity);
      let reservationStartDate = DateTime.fromISO(new Date(group.reservationStartDate).toISOString());
      let reservationEndDate = DateTime.fromISO(new Date(group.reservationEndDate).toISOString());
      const meteredTimePeriodInHours = Math.abs(
        reservationEndDate.diff(reservationStartDate, ['hours']).toObject()?.hours || 0,
      ); // hours
      let targetCapacityInKiloWattHour = group.targetCapacityInMegaWattHour * 1000;
      if (aggregatedCapacity * meteredTimePeriodInHours < targetCapacityInKiloWattHour) {
        smallHackAsEvenAfterReturnReservationGettingCreatedWillUseBoolean = true;
        return new Promise((resolve, reject) => {
          reject(new ConflictException({
            success: false,
            message: 'Target Capacity Cannot be reached by selected devices within provided start date and end date, either add more devices or increase the end date duration',
            details: { meteredTimePeriodInHours, targetCapacityInMegaWattHour: group.targetCapacityInMegaWattHour, probablyAchievableCapacityInMegaWattHour: aggregatedCapacity * meteredTimePeriodInHours * 0.001 }
          }))
        })
      }
    }
    if (smallHackAsEvenAfterReturnReservationGettingCreatedWillUseBoolean === false) {
      let deviceGroup: NewDeviceGroupDTO = this.createDeviceGroupFromDevices(devices, group.name);
      deviceGroup['reservationStartDate'] = group.reservationStartDate;
      deviceGroup['reservationEndDate'] = group.reservationEndDate;
      deviceGroup['authorityToExceed'] = group.authorityToExceed;
      deviceGroup['targetVolumeInMegaWattHour'] = group.targetCapacityInMegaWattHour;
      deviceGroup['targetVolumeCertificateGenerationFailedInMegaWattHour'] = 0;
      deviceGroup['targetVolumeCertificateGenerationSucceededInMegaWattHour'] = 0;
      deviceGroup['targetVolumeCertificateGenerationRequestedInMegaWattHour'] = 0;
      deviceGroup['targetVolumeCertificateGenerationRequestedInMegaWattHour'] = 0;
      deviceGroup['frequency'] = group.frequency;
      deviceGroup['deviceIdsInt'] = group.deviceIds;
      deviceGroup['reservationActive'] = true
      if (buyerId && buyerAddress) {
        deviceGroup['buyerId'] = buyerId;
        deviceGroup['buyerAddress'] = buyerAddress;
      }
      if(group.api_user_id) {
        deviceGroup['api_user_id'] = group.api_user_id;
      }
      let responseDeviceGroupDTO: ResponseDeviceGroupDTO = await this.create(
        organizationId,
        deviceGroup,
      );
      responseDeviceGroupDTO.unavailableDeviceIDsDueToAreIncludedInBuyerReservation = unavailableDeviceIdsDueToAlreadyIncludedInBuyerReservation.length > 0 ? unavailableDeviceIdsDueToAlreadyIncludedInBuyerReservation.join(' , ') : '';
      delete responseDeviceGroupDTO["deviceIdsInt"];
      return responseDeviceGroupDTO;
    }
  }


  async update(
    id: number,
    User: ILoggedInUser,
    data: NewUpdateDeviceGroupDTO,
  ): Promise<DeviceGroupDTO> {

    await this.checkNameConflict(data.name);
    let deviceGroup = await this.findDeviceGroupById(id, User.organizationId);
    if (User.id != deviceGroup.buyerId) {
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
  ) {
    const deviceGroup = await this.findDeviceGroupById(groupId, organizationId);
    //console.log(deviceGroup);
    //@ts-ignore
    //console.log("updatetargetmwh")
    //console.log(deviceGroup.targetVolumeCertificateGenerationRequestedInMegaWattHour);
    //console.log(targetVolumeCertificateGenerationRequestedInMegaWattHour);
    deviceGroup.targetVolumeCertificateGenerationRequestedInMegaWattHour = deviceGroup.targetVolumeCertificateGenerationRequestedInMegaWattHour + targetVolumeCertificateGenerationRequestedInMegaWattHour;
    //console.log("afterupdatetargetmwh")
    //console.log(deviceGroup.targetVolumeCertificateGenerationRequestedInMegaWattHour);
    const updatedGroup = await this.repository.save(deviceGroup);
    //console.log(updatedGroup);
    return updatedGroup;
  }

  async updateLeftOverRead(
    id: number,
    leftOverRead: number,
  ): Promise<DeviceGroupDTO> {
    const deviceGroup = await this.findById(id);
    deviceGroup.leftoverReads = leftOverRead;
    const updatedGroup = await this.repository.save(deviceGroup);
    return updatedGroup;
  }

  async updateLeftOverReadByCountryCode(
    id: number,
    leftOverRead: number,
    countryCodeKey: string
  ): Promise<DeviceGroupDTO> {
    const deviceGroup = await this.findById(id);
    if (deviceGroup.leftoverReadsByCountryCode === null || deviceGroup.leftoverReadsByCountryCode === undefined || deviceGroup.leftoverReadsByCountryCode === '') {
      deviceGroup.leftoverReadsByCountryCode = {};
    }
    if (typeof deviceGroup.leftoverReadsByCountryCode === 'string') {
      deviceGroup.leftoverReadsByCountryCode = JSON.parse(deviceGroup.leftoverReadsByCountryCode);
    }
    deviceGroup.leftoverReadsByCountryCode[countryCodeKey] = leftOverRead;
    deviceGroup.leftoverReadsByCountryCode = JSON.stringify(deviceGroup.leftoverReadsByCountryCode);
    const updatedGroup = await this.repository.save(deviceGroup);
    return updatedGroup;
  }

  async remove(id: number, organizationId: number): Promise<void> {
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
    organizationId: number
  ): Promise<Array<string>> {
    const allExternalIds: Array<string> = [];
    const existingDeviceIds: Array<string> = [];
    newDevices.forEach((singleDevice) =>
      allExternalIds.push(singleDevice.externalId),
    );
    const existingDevices =
      await this.deviceService.findMultipleDevicesBasedExternalId(
        allExternalIds,
        organizationId
      );
    //////console.log("existingDevices",existingDevices);
    if (existingDevices && existingDevices.length > 0) {
      //@ts-ignore
      existingDevices.forEach((ele) => existingDeviceIds.push(ele?.developerExternalId));
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
    const devices: (
      | DeviceDTO
      | { isError: boolean; device: NewDeviceDTO; errorDetail: any }
    )[] = await Promise.all(
      newDevices.map(async (device: NewDeviceDTO) => {
        try {
          if(api_user_id == null) {
            return await this.deviceService.register(orgCode, device);
          }
          else {
            return await this.deviceService.register(orgCode, device, api_user_id, Role.ApiUser);
          }
        } catch (e) {
          console.log(e)
          return { isError: true, device: device, errorDetail: e };
        }
      }),
    );
    console.log(devices);
    return devices;
  }

  private async hasDeviceGroup(conditions: FindConditions<DeviceGroup>) {
    return Boolean(await this.findOne(conditions));
  }

  private async checkNameConflict(
    name: string,
    fromBulk = false,
  ): Promise<void | string> {
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
    const deviceGroup = await this.repository.findOne({
      id,
      organizationId,
    });
    if (!deviceGroup) {
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
    const dates = Array.from(
      new Set(
        devices.map((device: DeviceDTO) =>
          getDateRangeFromYear(device.commissioningDate),
        ),
      ),
    );
    return dates;
  }

  private createDeviceGroupFromDevices(
    devices: DeviceDTO[],
    groupName?: string,
  ): NewDeviceGroupDTO {
    const aggregatedCapacity = Math.floor(
      devices.reduce(
        (accumulator, currentValue: DeviceDTO) =>
          accumulator + currentValue.capacity,
        0,
      ),
    );
    const averageYieldValue = Math.floor(
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
      new Set(devices.map((device: DeviceDTO) => device.fuelCode ? device.fuelCode.trim() : ''
      )),
    );
    const countryCode = Array.from(
      new Set(devices.map((device: DeviceDTO) => device.countryCode ? device.countryCode.trim() : '')),
    );
    const deviceTypeCodes = Array.from(
      new Set(devices.map((device: DeviceDTO) => device.deviceTypeCode ? device.deviceTypeCode.trim() : '')),
    );
    const offTakers = Array.from(
      new Set(devices.map((device: DeviceDTO) => device.offTaker)),
    );
    const deviceIdsInt = Array.from(
      new Set(devices.map((device: DeviceDTO) => device.id)),
    );

    const deviceGroup: NewDeviceGroupDTO = {
      name: groupName,
      deviceIds: devices.map((device: DeviceDTO) => device.id),
      fuelCode: fuelCode,//[devices.map((device: DeviceDTO) => device.fuelCode ? device.fuelCode : '').join(' , ')],
      countryCode: countryCode,// [devices.map((device: DeviceDTO) => device.countryCode ? device.countryCode : '').join(' , ')],
      //standardCompliance: devices[0].standardCompliance,
      deviceTypeCodes: deviceTypeCodes,
      //@ts-ignore
      offTakers: offTakers,//[devices.map((device: DeviceDTO) => device.offTaker ? device.offTaker : '').join(' , ')],
      //installationConfigurations: [devices[0].installationConfiguration],
      //sectors,
      gridInterconnection,
      aggregatedCapacity,
      capacityRange: getCapacityRange(aggregatedCapacity),
      commissioningDateRange: this.getCommissioningDateRange(devices),
      //yieldValue: averageYieldValue,
      // labels: labels ?? [],
      //devicesIds: devicesIds
    };

    return deviceGroup;
  }

  private getreservationFilteredQuery(
    buyerId: number,
    filter?: UnreservedDeviceGroupsFilterDTO
  ): FindManyOptions<DeviceGroup> {
    console.log(filter)
    const where: FindConditions<DeviceGroup> = cleanDeep({
      // countryCode: filter.country && getCodeFromCountry(filter.country),
      // gridInterconnection: filter.gridInterconnection,
      // fuelCode: filter.fuelCode,
      reservationStartDate:
        filter.start_date &&
        filter.end_date &&
        Between(filter.start_date, filter.end_date),
      reservationEndDate:
        filter.start_date &&
        filter.end_date &&
        Between(filter.start_date, filter.end_date),
    });

    // if (filter.country) {
    //   where.countryCode = this.getRawFilter(filter.country);
    // }
    // if (filter.fuelCode) {
    //   where.fuelCode = this.getRawFilter(filter.fuelCode);
    // }
    if (filter.offTaker) {
      where.offTakers = this.getRawFilter(filter.offTaker);
    }
    // if (filter.commissioningDateRange) {
    //   where.commissioningDateRange = this.getRawFilter(
    //     filter.commissioningDateRange,
    //   );
    // }
    const query: FindManyOptions<DeviceGroup> = {
      where: {
        buyerId: buyerId || null,
        ...where,
      },
      order: {
        createdAt: 'DESC',
      },
    };
    console.log(query);

    return query;
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

    return Raw((alias) => `${alias} @> ARRAY[:...filterSectors]`, {
      filterSectors: [filter],
    });
  }

  private async hasSingleAddedJobForCSVProcessing(): Promise<
    DeviceCsvFileProcessingJobsEntity | undefined
  > {
    return await this.repositoyCSVJobProcessing.findOne({
      status: StatusCSV.Added,
    });
  }

  private async updateJobStatus(
    jobId: number,
    status: StatusCSV,
  ): Promise<DeviceCsvFileProcessingJobsEntity> {
    //@ts-ignore
    return await this.repositoyCSVJobProcessing.update(jobId, {
      status: status,
    });
  }

  @Cron(CronExpression.EVERY_30_SECONDS)
  //@Cron('*/3 * * * *')
  async getAddedCSVProcessingJobsAndStartProcessing() {
    console.log("bulkupload")
    const filesAddedForProcessing =
      await this.hasSingleAddedJobForCSVProcessing();
    if (filesAddedForProcessing === undefined) {
      return;
    }

    const data = new LoggedInUser({
      id: filesAddedForProcessing.userId,
      //@ts-ignore
      organization: { id: filesAddedForProcessing.organizationId },
    });
    data.id = filesAddedForProcessing.userId;
    data.organizationId = filesAddedForProcessing.organizationId;
    const response = await this.fileService.GetuploadS3(filesAddedForProcessing.fileId);

    console.log("response");
    // const response = await this.fileService.get(
    //   filesAddedForProcessing.fileId,
    //   data,
    // );
    console.log(response);
    if (response == undefined) {
      return;
    } else {
      ////console.log("started job processing",filesAddedForProcessing.jobId);
      this.updateJobStatus(filesAddedForProcessing.jobId, StatusCSV.Running);
      this.processCsvFileAnotherLibrary(
        response,
        filesAddedForProcessing.organizationId,
        filesAddedForProcessing,
      );
    }
  }

  /* Readable Stream didnt work for second file sent only when first file sent was working
  async processCsvFileAnotherLibrary(
    file: File,
    organizationId: number,
    filesAddedForProcessing: DeviceCsvFileProcessingJobsEntity,
  ) {
    //////console.log("into method");
    const records: Array<NewDeviceDTO> = [];
    const recordsErrors: Array<{ rowNumber:number;isError: boolean; errorsList: Array<any> }> =
      [];
      let rowsConvertedToCsvCount=0;
    //https://stackoverflow.com/questions/13230487/converting-a-buffer-into-a-readablestream-in-node-js/44091532#44091532
    const readableStream = new Readable();
    readableStream._read = () => {}; // _read is required but you can noop it
    readableStream
      .pipe(this.csvParser)
      .on('data', async (data) => {
        rowsConvertedToCsvCount++;
        data.images = [];
        data.groupId = null;
        const dataToStore = new NewDeviceDTO();

        const dataKeyForValidation: NewDeviceDTO = {
          externalId: '',
          projectName: '',
          address: '',
          latitude: '',
          longitude: '',
          countryCode: '',
          fuelCode: '',
          deviceTypeCode: '',
          capacity: 0,
          commissioningDate: '',
          gridInterconnection: false,
          offTaker: OffTaker.Commercial,
          yieldValue: 0,
          labels: '',
          impactStory: '',
          data: '',
          images: [],
          deviceDescription: DeviceDescription.GroundmountSolar,
          energyStorage: true,
          energyStorageCapacity: 0,
          qualityLabels: '',
          SDGBenefits:0,
          //groupId: 0,
        };
        for (const key in dataKeyForValidation) {
          //@ts-ignore
          if (typeof dataKeyForValidation[key] === 'string') {
            //@ts-ignore
            dataToStore[key] = data[key];
          }
          //@ts-ignore
          else if (typeof dataKeyForValidation[key] === 'boolean') {
            //@ts-ignore
            dataToStore[key] =
              data[key].toLowerCase() === 'true' ? true : false;
          }
          //@ts-ignore
          else if (typeof dataKeyForValidation[key] === 'number') {
            //@ts-ignore
            dataToStore[key] =
              parseFloat(data[key]) === NaN ? parseFloat(data[key]) : 0;
              //@ts-ignore
           if(key == 'yieldValue' && dataToStore[key]===0)
           {
            dataToStore[key]=1500;
           }
          }
          if(key == 'yieldValue' && data.countryCode)
          {
            let yieldByCountryCode=await this.yieldConfigService.findByCountryCode(data.countryCode);
            if(yieldByCountryCode)
            {
              //@ts-ignore
              dataToStore.yieldValue=yieldByCountryCode.yieldValue;
            }
          }
          // //@ts-ignore
          // else if (key === 'generatorsIds') {
          //   if (data[key] === '') {
          //     //@ts-ignore
          //     dataToStore[key] = [];
          //   } else {
          //     //@ts-ignore
          //     dataToStore[key] = data[key].split('|').map(
          //       //@ts-ignore
          //       (ele) => (parseFloat(ele) === NaN ? 0 : parseFloat(ele)),
          //     );
          //     //@ts-ignore
          //     dataToStore[key] = dataToStore[key].filter((ele) => ele !== 0);
          //   }
          // }
        }
        for(let key in dataToStore)
        {
          //@ts-ignore
          dataToStore[key] === ''?dataToStore[key]=null:'';
        }

        //////console.log("records",JSON.stringify(records));

        records.push(dataToStore);
        recordsErrors.push({ rowNumber:rowsConvertedToCsvCount,isError: false, errorsList: [] });
      })
      .on('end', async () => {
        //////console.log("data end transmissiodsdddddddddddn",records);
        for(let index=0;index<records.length;index++)
        {
          let singleRecord = records[index];
          //////console.log("waiting");
          const errors = await validate(singleRecord);
          //////console.log("validation errors",errors);
          // errors is an array of validation errors
          if (errors.length > 0) {
            recordsErrors[index] = { rowNumber: index, isError: true, errorsList: errors };
          } else {
            recordsErrors[index] = { rowNumber: index, isError: false, errorsList: errors };
          }
        }

        const noErrorRecords = records.filter(
          (record, index) => recordsErrors[index].isError === false,
        );
        const listofExistingDevices = await this.checkIfDeviceExisting(records);
        if (listofExistingDevices.length > 0) {
          records.forEach((singleRecord, index) => {
            listofExistingDevices.find(
              (ele) => ele === singleRecord.externalId,
            );
            recordsErrors[index].isError = true;
            recordsErrors[index].errorsList.push({
              error: 'Smae ExternalId already exist, cant add entry with same external id ',
            });
          });
        }
        //////console.log("listofExistingDevices",listofExistingDevices);
        let successfullyAddedRowsAndExternalIds:Array<{rowNumber:number,externalId:string}>=[];
        //noErrorRecords= records.filter((record,index)=> recordsErrors[index].isError === false);
        const devicesRegistered = await this.registerCSVBulkDevices(
          organizationId,
          records,
        );
        //////console.log("devicesRegistered",devicesRegistered); 
        //@ts-ignore
        devicesRegistered.filter(ele=>ele.isError === undefined).forEach(ele=>{
          if(ele instanceof DeviceDTO)
          {
            successfullyAddedRowsAndExternalIds.push({externalId: ele.externalId,rowNumber: records.findIndex(recEle=>recEle.externalId=== ele.externalId) +1});
          }
        })
        //////console.log("recordsErrors.find((ele) => ele.isError === true)",recordsErrors)
       
        if (recordsErrors.find((ele) => ele.isError === true)) {
          //////console.log("insie if ");
          this.createFailedRowDetailsForCSVJob(
            filesAddedForProcessing.jobId,
            recordsErrors,
            successfullyAddedRowsAndExternalIds
          );
        }

        //////console.log("osdksnd if ");

        this.updateJobStatus(
          filesAddedForProcessing.jobId,
          StatusCSV.Completed,
        );

      });
    //////console.log("file?.data.toString()",file?.data.toString());
    this.csvStringToJSON(file?.data.toString());
    
    csvtojsonV2().fromString(file?.data.toString()).subscribe((csvLine)=>{ 
      //////console.log("csvLine",csvLine);
    // csvLine =>  "1,2,3" and "4,5,6"
    })

    readableStream.emit('data', file?.data.toString());
    setTimeout(()=>{
      //////console.log("data ending emission");
      readableStream.emit('end');
    },60000);
    

    // },1);
  }
  */

  async processCsvFileAnotherLibrary(
    file: any,
    organizationId: number,
    filesAddedForProcessing: DeviceCsvFileProcessingJobsEntity,
  ) {
    console.log("into method");
    console.log(file.data.Body.toString('utf-8'));
    const records: Array<NewDeviceDTO> = [];
    const recordsErrors: Array<{ externalId: string; rowNumber: number; isError: boolean; errorsList: Array<any> }> =
      [];
    let rowsConvertedToCsvCount = 0;
    //https://stackoverflow.com/questions/13230487/converting-a-buffer-into-a-readablestream-in-node-js/44091532#44091532
    const readableStream = new Readable();
    readableStream._read = () => { }; // _read is required but you can noop it
    readableStream
      .pipe(this.csvParser)
      .on('data', async (data) => {

      })
      .on('end', async () => {


      });
    console.log("file?.data.toString()", file?.data.toString());
    const filedata = file.data.Body.toString('utf-8')
    this.csvStringToJSON(filedata);

    csvtojsonV2().fromString(filedata).subscribe(async (data: any, lineNumber: any) => {
      ////console.log("csvLine",data,"sdsds",lineNumber);
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
        deviceTypeCode: DevicetypeCode.TC150,
        capacity: 0,
        commissioningDate: '',
        gridInterconnection: false,
        offTaker: OffTaker.Commercial,
        //yieldValue: 0,
        //labels: '',
        impactStory: '',
        // data: '',
        images: [],
        deviceDescription: DeviceDescription.GroundmountSolar,
        energyStorage: true,
        energyStorageCapacity: 0,
        qualityLabels: '',
        SDGBenefits: [],
        version: "1.0",
        //groupId: 0,
      };
      for (const key in dataKeyForValidation) {
        if (key === "SDGBenefits" || key === "version") {
          continue;
        }
        //@ts-ignore
        if (typeof dataKeyForValidation[key] === 'string') {
          //@ts-ignore
          dataToStore[key] = data[key];
        }
        //@ts-ignore
        else if (typeof dataKeyForValidation[key] === 'boolean') {
          //@ts-ignore
          dataToStore[key] =
            data[key].toLowerCase() === 'true' ? true : false;
        }
        //@ts-ignore
        else if (typeof dataKeyForValidation[key] === 'number') {
          //@ts-ignore
          dataToStore[key] =
            Number.isNaN(data[key]) ? 0 : parseFloat(data[key]);
          //@ts-ignore
          if (key == 'yieldValue' && dataToStore[key] === 0) {
           // dataToStore[key] = 1500;
            dataToStore[key] = 2000;
          }

          if (key === "SdgBenefits") {
            ////console.log("data[key]",data[key]);
            ////console.log("dataToStore[key]",dataToStore[key]);
          }
        }
        if (key == 'yieldValue' && data.countryCode) {
          let yieldByCountryCode = await this.yieldConfigService.findByCountryCode(data.countryCode);
          if (yieldByCountryCode) {
            //@ts-ignore
            dataToStore.yieldValue = yieldByCountryCode.yieldValue;
          }
        }
      }
      for (let key in dataToStore) {
        //@ts-ignore
        dataToStore[key] === '' ? dataToStore[key] = null : '';
      }

      // console.log("records", JSON.stringify(records));

      records.push(dataToStore);
      recordsErrors.push({ externalId: '', rowNumber: rowsConvertedToCsvCount, isError: false, errorsList: [] });

      // csvLine =>  "1,2,3" and "4,5,6"
    }).on('done', async (error: any) => {

      for (let index = 0; index < records.length; index++) {
        let singleRecord = records[index];
        if (records[index].externalId) {
          records[index].externalId = records[index].externalId.trim();
        }
        const errors = await validate(singleRecord);
        if (errors.length > 0) {

          errors.forEach(ele => {
            delete ele.target;
            delete ele.children;
          })
          recordsErrors[index] = { externalId: records[index].externalId, rowNumber: index, isError: true, errorsList: errors };
        } else {
          recordsErrors[index] = { externalId: records[index].externalId, rowNumber: index, isError: false, errorsList: errors };
        }
        // if (singleRecord.externalId != undefined || singleRecord.externalId != null) {
        //   const Regex = /^[a-zA-Z\d\-_\s]+$/;

        //   if(!Regex.test(singleRecord.externalId)){
        //     recordsErrors[index].isError = true;
        //     recordsErrors[index].errorsList.push({ value: singleRecord.externalId, property: "externalId", constraints: { invalidExternalId: "external id can contain only alphabets( lower and upper case included), numeric(0 to 9), hyphen(-), underscore(_) and spaces in between" } })

        //   }

        // }
        if (singleRecord.countryCode != undefined) {

          singleRecord.countryCode = singleRecord.countryCode.toUpperCase();
          if (singleRecord.countryCode && typeof singleRecord.countryCode === "string" && singleRecord.countryCode.length === 3) {

            if (countryCodesList.find(ele => ele.countryCode === singleRecord.countryCode) === undefined) {
              recordsErrors[index].isError = true;
              recordsErrors[index].errorsList.push({ value: singleRecord.countryCode, property: "countryCode", constraints: { invalidCountryCode: "Invalid countryCode" } })
            }
          } else {
            recordsErrors[index].isError = true;
            recordsErrors[index].errorsList.push({ value: singleRecord.countryCode, property: "countryCode", constraints: { invalidCountryCode: "Invalid countryCode" } })
          }
        } else {
          recordsErrors[index].isError = true;
          recordsErrors[index].errorsList.push({ value: singleRecord.countryCode, property: "countryCode", constraints: { invalidCountryCode: "Invalid countryCode" } })
        }
        if (singleRecord.commissioningDate && typeof singleRecord.commissioningDate === "string") {

          console.log(!isValidUTCDateFormat(singleRecord.commissioningDate));
          if (!isValidUTCDateFormat(singleRecord.commissioningDate)) {
            const hasValidSeconds = moment(singleRecord.commissioningDate).seconds() < 60;
            const hasValidMinutes = moment(singleRecord.commissioningDate).minutes() < 60;
            recordsErrors[index].isError = true;
            if (!hasValidMinutes) {
              recordsErrors[index].errorsList.push({ value: singleRecord.commissioningDate, property: "commissioningDate", constraints: { invalidDate: "Invalid minutes value." } })
            }
            else if (!hasValidSeconds) {
              recordsErrors[index].errorsList.push({ value: singleRecord.commissioningDate, property: "commissioningDate", constraints: { invalidDate: "Invalid seconds value." } })
            }
            recordsErrors[index].errorsList.push({ value: singleRecord.commissioningDate, property: "commissioningDate", constraints: { invalidDate: "Invalid commission date sent.Format is YYYY-MM-DDThh:mm:ss.millisecondsZ example 2022-10-18T11:35:27.640Z" } })
          }
          if (new Date(singleRecord.commissioningDate).getTime() > new Date().getTime()) {
            recordsErrors[index].isError = true;
            recordsErrors[index].errorsList.push({ value: singleRecord.commissioningDate, property: "commissioningDate", constraints: { invalidDate: "Invalid commissioning date, commissioning is greater than current date" } })
          }
        }
        if (singleRecord.capacity <= 0) {
          recordsErrors[index].isError = true;
          recordsErrors[index].errorsList.push({ value: singleRecord.capacity, property: "capacity", constraints: { greaterThanZero: "Capacity should be greater than 0" } })
        }
        if (singleRecord.energyStorageCapacity < 0) {
          recordsErrors[index].isError = true;
          recordsErrors[index].errorsList.push({ value: singleRecord.energyStorageCapacity, property: "energyStorageCapacity", constraints: { greaterThanZero: "Energy Storage Capacity should be greater than 0" } })
        }
      }

      records.forEach((singleRecord, index) => {
        recordsErrors[index].errorsList.forEach(error => {
          singleRecord[error.property] = null;//making null field if it has any validation issue 
        })
      });

      const noErrorRecords = records.filter(
        (record, index) => recordsErrors[index].isError === false,
      );
      const listofExistingDevices = await this.checkIfDeviceExisting(records, organizationId);

      if (listofExistingDevices.length > 0) {
        records.forEach((singleRecord, index) => {
          if (listofExistingDevices.find(
            (ele) => ele === singleRecord.externalId,
          )) {
            recordsErrors[index].isError = true;
            recordsErrors[index].errorsList.push(
              { value: singleRecord.externalId, property: "externalId", constraints: { externalIdExists: "ExternalId already exist, cant add entry with same external id" } }
            );
          }
        });
      }
      var recordsCopy = cloneDeep(records);
      recordsCopy.forEach(ele => ele['statusDuplicate'] = false)
      const duplicatesExternalId: any = [];
      for (let i = 0; i < recordsCopy.length - 1; i++) {
        console.log(recordsCopy[i].externalId);
        for (let j = i + 1; j < recordsCopy.length; j++) {
          console.log(recordsCopy[j].externalId);
          if (recordsCopy[i].externalId != null && recordsCopy[j].externalId != null) {
            if (recordsCopy[i].externalId.toLowerCase() === recordsCopy[j].externalId.toLowerCase() && recordsCopy[j]['statusDuplicate'] === false) {
              recordsCopy[j]['statusDuplicate'] = true;
              duplicatesExternalId.push({
                duplicateIndex: j,
                duplicateWith: i,
                projectName: records[j].projectName,
                externalId: records[j].externalId
              });
              recordsErrors[j].isError = true;
              recordsErrors[j].errorsList.push(
                { value: recordsCopy[j].externalId, property: "externalId", constraints: { externalIdExists: "Row " + (j + 1) + " Duplicate with row " + (i + 1) + " Exists with externalId " + records[j].externalId } }
              );
            }
          }

        }
      }

      let successfullyAddedRowsAndExternalIds: Array<{ rowNumber: number, externalId: string }> = [];
      //noErrorRecords= records.filter((record,index)=> recordsErrors[index].isError === false);
      let recordsToRegister = records.filter((ele, index) => {
        if (recordsErrors[index].errorsList.length > 0) {
          //these are required fields and if one is having error we cannot try to insert the record
          if (recordsErrors[index].errorsList.find(errorRec => errorRec.property === "externalId" || errorRec.property === "commissioningDate" || errorRec.property === "capacity" || errorRec.property === "countryCode")) {
            return false;
          }
          else {
            return true;
          }
        }
        else
          return true;
      })

      console.log(recordsToRegister);
      console.log("records", records);
      const devicesRegistered = await this.registerCSVBulkDevices(
        organizationId,
        recordsToRegister,
        filesAddedForProcessing.api_user_id,
      );
      console.log(devicesRegistered);
      //@ts-ignore

      devicesRegistered.filter(ele => ele.isError === undefined).forEach(ele => {

        //@ts-ignore
        successfullyAddedRowsAndExternalIds.push({ externalId: ele.externalId, rowNumber: records.findIndex(recEle => recEle.developerExternalId === ele.externalId) });
      })

      recordsErrors.forEach((ele, index) => {
        if (ele.isError === false) { ele["status"] = 'Success'; }

        else if (ele.isError === true && successfullyAddedRowsAndExternalIds.find(successEle => (successEle.externalId === ele.externalId && successEle.rowNumber === index))) {
          ele['status'] = 'Success with validation errors, please update fields';
        }
        else {
          ele['status'] = 'Failed';
        }
      });
      //console.log(recordsErrors);
      this.createFailedRowDetailsForCSVJob(
        filesAddedForProcessing.jobId,
        recordsErrors,
        successfullyAddedRowsAndExternalIds
      );
      this.updateJobStatus(
        filesAddedForProcessing.jobId,
        StatusCSV.Completed,
      );
    })

  }

  csvStringToJSON(csvFileContentInString: string) {
    // Convert the data to String and
    // split it in an array
    var array = csvFileContentInString.split("\r");

    // All the rows of the CSV will be
    // converted to JSON objects which
    // will be added to result in an array
    let result = [];

    // The array[0] contains all the
    // header columns so we store them
    // in headers array
    let headers = array[0].split(", ")

    // Since headers are separated, we
    // need to traverse remaining n-1 rows.
    for (let i = 1; i < array.length - 1; i++) {
      let obj = {}

      // Create an empty object to later add
      // values of the current row to it
      // Declare string str as current array
      // value to change the delimiter and
      // store the generated string in a new
      // string s
      let str = array[i]
      let s = ''

      // By Default, we get the comma separated
      // values of a cell in quotes " " so we
      // use flag to keep track of quotes and
      // split the string accordingly
      // If we encounter opening quote (")
      // then we keep commas as it is otherwise
      // we replace them with pipe |
      // We keep adding the characters we
      // traverse to a String s
      let flag = 0
      for (let ch of str) {
        if (ch === '"' && flag === 0) {
          flag = 1
        }
        else if (ch === '"' && flag == 1) flag = 0
        if (ch === ', ' && flag === 0) ch = '|'
        if (ch !== '"') s += ch
      }

      // Split the string using pipe delimiter |
      // and store the values in a properties array
      let properties = s.split("|")

      // For each header, if the value contains
      // multiple comma separated data, then we
      // store it in the form of array otherwise
      // directly the value is stored
      for (let j in headers) {
        if (properties[j].includes(", ")) {
          //@ts-ignore
          obj[headers[j]] = properties[j]
            .split(", ").map(item => item.trim())
        }
        else {
          //@ts-ignore
          obj[headers[j]] = properties[j];
        }
      }

      // Add the generated object to our
      // result array
      result.push(obj)
    }

    //////console.log(result);
  }

  // async getGroupiCertificateIssueDate(
  //   organizationId: number,
  // ): Promise<DeviceGroupIssueCertificate{}> {
  //   ////console.log(organizationId);
  //   return await this.repositoryDeviceGroupcertificate.findByIds({
  //     organizationId
  //     //status:StatusCSV.Completed
  //   });
  // }


  async checkIfOrganizationHasBlockhainAddressAdded(organizationId: number): Promise<boolean> {
    const organization = await this.organizationService.findOne(
      organizationId,
    );
    if (organization.blockchainAccountAddress) {
      return true;
    }
    else {
      return false;
    }

  }
  async getGroupiCertificateIssueDate(
    conditions: FindConditions<DeviceGroupNextIssueCertificate>,
  ): Promise<DeviceGroupNextIssueCertificate | null> {
    console.log("1883")
    return (await this.repositorynextDeviceGroupcertificate.findOne(conditions)) ?? null;
  }
  async getAllNextrequestCertificate(
  ): Promise<DeviceGroupNextIssueCertificate[]> {
    const groupId = await this.repositorynextDeviceGroupcertificate.find({
      where: { end_date: LessThan(new Date()) },
    });
    ////console.log(groupId)
    return groupId
  }

  async updatecertificateissuedate(
    id: number,
    startdate: string,
    enddate: string,
  ): Promise<DeviceGroupNextIssueCertificate> {
    // await this.checkNameConflict(data.name);
    const deviceGroupdate = await this.getGroupiCertificateIssueDate({ id: id });
    let updatedissuedate = new DeviceGroupNextIssueCertificate();
    if (deviceGroupdate) {

      deviceGroupdate.start_date = startdate;
      deviceGroupdate.end_date = enddate;
      updatedissuedate = await this.repositorynextDeviceGroupcertificate.save(deviceGroupdate);


    }
    return updatedissuedate;
  }

  async EndReservationGroup(
    groupId: number,
    organizationId: number,
    reservationend: EndReservationdateDTO,
    group?: DeviceGroupDTO | DeviceGroup,
    deviceGroupIssueNextDateDTO?: DeviceGroupNextIssueCertificate,
  ): Promise<void> {
    if (!group)
      group = await this.findDeviceGroupById(groupId, organizationId);
    //@ts-ignore
    ////console.log("new Date(group?.reservationEndDate).getTime() === new Date(reservationend).getTime()", "group?.reservationEndDate", group?.reservationEndDate, "reservationend", reservationend, "new Date(group?.reservationEndDate).getTime()", new Date(group?.reservationEndDate).getTime(), "new Date(reservationend).getTime()", new Date(reservationend).getTime(), new Date(group?.reservationEndDate).getTime() === new Date(reservationend).getTime());
    //@ts-ignore
    if (new Date(group?.reservationEndDate).getTime() === new Date(reservationend.endresavationdate).getTime()) {
      ////console.log("came inside ending reservation");

      if (!deviceGroupIssueNextDateDTO)
        deviceGroupIssueNextDateDTO = await this.getGroupiCertificateIssueDate({ groupId: groupId });
      //@ts-ignore

      this.endReservation(groupId, group, deviceGroupIssueNextDateDTO)
      return;
    }

  }


  async endReservation(
    groupId: number,
    group: DeviceGroup,
    deviceGroupIssueNextDateDTO: DeviceGroupNextIssueCertificate
  ): Promise<void> {

    let updatedissuedatestatus = new DeviceGroup();
    if (group) {

      group.reservationActive = false
      updatedissuedatestatus = await this.repository.save(group);

    }

    await this.repositorynextDeviceGroupcertificate.delete(deviceGroupIssueNextDateDTO.id);
    let devices = await this.deviceService.findForGroup(groupId);

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

  async deactiveReaservation(group: DeviceGroup): Promise<void> {
    //console.log(group);
    let updatedissuedatestatus = new DeviceGroup();
    if (group) {

      group.reservationActive = false
      updatedissuedatestatus = await this.repository.save(group);
      return;
    }


  }

  public async getDeviceGrouplog(
    groupid: number,
  ): Promise<CheckCertificateIssueDateLogForDeviceGroupEntity[] | undefined> {
    return this.checkdevciegrouplogcertificaterepository.find({
      where: {
        groupid,
      },
    });
  }

  public async AddCertificateIssueDateLogForDeviceGroup(params: CheckCertificateIssueDateLogForDeviceGroupEntity
  ): Promise<CheckCertificateIssueDateLogForDeviceGroupEntity> {
    return await this.checkdevciegrouplogcertificaterepository.save({
      ...params,

    });
  }


  public async getNextHistoryissuanceDevicelog(

  ): Promise<HistoryDeviceGroupNextIssueCertificate[] | undefined> {
    return this.historynextissuancedaterepository.find({
      where: {
        status: HistoryNextInssuanceStatus.Pending
      }
    });
  }

  public async countgroupIdHistoryissuanceDevicelog(groupId: number): Promise<number> {
    //const repository = getRepository(HistoryDeviceGroupNextIssueCertificate);
    const count = await this.historynextissuancedaterepository.count({
      where: {
        groupId: groupId,
        status: 'Pending',
      },
    });
    console.log(groupId, "count", count)
    return count;
  }



  public async getNextHistoryissuanceDevicelogafterreservation(
    developerExternalId: any,
    groupId: any
  ): Promise<HistoryDeviceGroupNextIssueCertificate | undefined> {
    console.log(developerExternalId);
    console.log(groupId);
    console.log("result1844");
    console.log("result1844");
    const result = await this.historynextissuancedaterepository.findOne({
      device_externalid: developerExternalId,
      groupId: groupId,
      status: 'Completed'
    });
    console.log(result);
    return result
  }

  async getHistoryCertificateIssueDate(
    conditions: FindConditions<HistoryDeviceGroupNextIssueCertificate>,
  ): Promise<HistoryDeviceGroupNextIssueCertificate | null> {
    return (await this.historynextissuancedaterepository.findOne(conditions)) ?? null;
  }
  async HistoryUpdatecertificateissuedate(
    id: number,
    Status: HistoryNextInssuanceStatus
  ): Promise<HistoryDeviceGroupNextIssueCertificate> {
    ////console.log("HistoryUpdatecertificateissuedate")
    // await this.checkNameConflict(data.name);
    const historynextdate = await this.getHistoryCertificateIssueDate({ id: id });
    let updatedissuedatestatus = new HistoryDeviceGroupNextIssueCertificate();
    if (historynextdate) {

      historynextdate.status = Status
      updatedissuedatestatus = await this.historynextissuancedaterepository.save(historynextdate);

    }
    return updatedissuedatestatus;
  }

  async getallReservationactive(): Promise<DeviceGroup[]> {
    const activeresvation = await this.repository.find({
      where: {
        reservationActive: true
      }
    })
    console.log(activeresvation);
    return activeresvation
  }

  async getcurrentInformationofDevicesInReservation(groupuid): Promise<any> {
    const group = await this.findOne({ devicegroup_uid: groupuid, reservationActive: true })
    // console.log(group)
    if (group === null) {
      return new Promise((resolve, reject) => {
        reject(new ConflictException({
          success: false,
          message: 'Group UId is not of this buyer, invalid value was sent',
        }))
      })
    }
    const devices = await this.deviceService.findByIds(group.deviceIdsInt);
    const device_historynextissuance = [];
    await Promise.all(
      devices.map(async (device) => {
        // console.log(device);
        const historynext_issuancer = await this.historynextissuancedaterepository.find(
          {
            where: {
              groupId: group.id,
              device_externalid: device.externalId
            },
          }
        );
        historynext_issuancer.forEach(element => {
          element.device_externalid = device.developerExternalId
          delete element["createdAt"];
          delete element["groupId"];
          delete element["id"];
          delete element["updatedAt"];

        });
        device_historynextissuance.push({
          historynext_issuancer,

        })
      }),
    );
    let AllDeviceshistnextissuansinfo: any = []
    device_historynextissuance.forEach(ele => ele.historynext_issuancer.forEach(he => AllDeviceshistnextissuansinfo.push(he)))
    //console.log(group.id)
    let nextissuance = {};
    nextissuance = await this.repositorynextDeviceGroupcertificate.findOne({
      where: {
        groupId: group.id
      }
    }) ?? null;
    //console.log(nextissuance)

    return {

      AllDeviceshistnextissuansinfo,
      ongoing_next_issuance: nextissuance
    }
  }

  async getReservationInforDeveloperBsise(orgId, role, filterDto, pageNumber): Promise<any> {
    const pageSize = 10;
    if (pageNumber <= 0) {
      throw new HttpException('Invalid page number', HttpStatus.BAD_REQUEST);
    }
    const skip = (pageNumber - 1) * pageSize;
    console.log(skip)
    let queryBuilder: any;
    queryBuilder = this.repository.createQueryBuilder('dg')
      .innerJoin(Device, 'd', 'd.id = ANY(dg.deviceIdsInt)')
      .innerJoin(
        CheckCertificateIssueDateLogForDeviceGroupEntity,
        'dg_log',
        'dg_log.groupId = dg.id'
      )
      .innerJoin(
        CertificateReadModelEntity,
        'crm',
        'dg_log.certificateTransactionUID = (crm.metadata::jsonb)->>\'certificateTransactionUID\''
      )
      .select('DISTINCT ON (dg.id, crm.internalCertificateId) dg.id AS deviceGroupId, dg.name, dg.deviceIdsInt, d.*, dg_log.readvalue_watthour, crm.internalCertificateId')
      .orderBy('dg.id, crm.internalCertificateId, dg_log.readvalue_watthour', 'ASC')

    queryBuilder.where((qb) => {
      let where_orgnaizationId: any;
      if (role === 'OrganizationAdmin') {
        where_orgnaizationId = qb.where(`d.organizationId = :orgId`, { orgId: orgId })
      }
      if (role === 'Buyer') {
        where_orgnaizationId = qb.where(`dg.organizationId = :orgId`, { orgId: orgId })
      }

      where_orgnaizationId
        .andWhere('EXISTS(SELECT 1 FROM jsonb_array_elements_text(CAST(crm.metadata  AS jsonb)->\'deviceIds\') AS ids(deviceId) WHERE CAST(ids.deviceId AS INTEGER) = d.id)')
        .andWhere(new Brackets(qb => {
          if (filterDto.country) {
            const string = filterDto.country;
            const values = string.split(",");
            console.log(values);
            let CountryInvalid = false;
            filterDto.country = filterDto.country.toUpperCase();
            if (filterDto.country && typeof filterDto.country === "string" && filterDto.country.length === 3) {
              let countries = countryCodesList;
              if (countries.find(ele => ele.countryCode === filterDto.country) === undefined) {
                CountryInvalid = true;
              }
            }

            if (!CountryInvalid) {
              const newCountry = filterDto.country.toString()
              console.log(typeof newCountry)
              const CountryArray = newCountry.split(',');
              qb.orWhere(new Brackets(qb => {

                CountryArray.forEach((country, index) => {
                  if (index === 0) {
                    qb.where(`d.countryCode ILIKE :benefit${index}`, { [`benefit${index}`]: `%${country}%` });
                  } else {
                    qb.orWhere(`d.countryCode ILIKE :benefit${index}`, { [`benefit${index}`]: `%${country}%` });
                  }
                });
              }));

              // qb.orWhere('d.countryCode LIKE = :countrycode', { countrycode: `%${filterDto.country}%` });

            }
          }
          if ((filterDto.fuelCode)) {
            console.log(typeof filterDto.fuelCode);
            console.log(typeof filterDto.fuelCode);
            const newfuelCode = filterDto.fuelCode.toString()
            console.log(typeof newfuelCode)
            const fuelCodeArray = newfuelCode.split(',');
            qb.orWhere(new Brackets(qb => {

              fuelCodeArray.forEach((fuelCode, index) => {
                if (index === 0) {
                  qb.where(`d.fuelCode ILIKE :benefit${index}`, { [`benefit${index}`]: `%${fuelCode}%` });
                } else {
                  qb.orWhere(`d.fuelCode ILIKE :benefit${index}`, { [`benefit${index}`]: `%${fuelCode}%` });
                }
              });
            }));
            //  qb.orWhere(`d.fuelCode LIKE = :fuelcode`,  `%${filterDto.fuelCode}%`);

          }
          if (filterDto.offTaker) {
            // console.log(typeof filterDto.offTaker);
            const newoffTaker = filterDto.offTaker.toString()
            console.log(typeof newoffTaker)
            const offTakerArray = newoffTaker.split(',');
            qb.orWhere(new Brackets(qb => {

              offTakerArray.forEach((offTaker, index) => {
                if (index === 0) {
                  qb.where(`d.offTaker ILIKE :benefit${index}`, { [`benefit${index}`]: `%${offTaker}%` });
                } else {
                  qb.orWhere(`d.offTaker ILIKE :benefit${index}`, { [`benefit${index}`]: `%${offTaker}%` });
                }
              });
            }));
            // qb.orWhere('d.offTakers LIKE = :offTaker',  `%${filterDto.offTaker}%`);

          }
          const startTimestamp = new Date(filterDto.start_date).getTime() / 1000;
          const endTimestamp = new Date(filterDto.end_date).getTime() / 1000;
          if (filterDto.start_date && filterDto.end_date === undefined) {
            qb.orWhere("crm.generationStartTime > :certificateStartDate ", { certificateStartDate: startTimestamp })
          }
          if (filterDto.end_date && filterDto.start_date === undefined) {
            qb.orWhere("crm.generationEndTime  <:certificateEndDate", { certificateEndDate: endTimestamp })
          }
          if (filterDto.start_date && filterDto.end_date) {
            qb.orWhere("crm.generationStartTime BETWEEN :certificateStartDate1  AND :certificateEndDate1", { certificateStartDate1: startTimestamp, certificateEndDate1: endTimestamp })
          }
          if (filterDto.SDGBenefits) {
            console.log(filterDto.SDGBenefits);

            const newsdg = filterDto.SDGBenefits.toString()
            console.log(typeof newsdg)
            const sdgBenefitsArray = newsdg.split(',');
            const sdgBenefitString = sdgBenefitsArray.map((benefit) => benefit).join(',');
            qb.orWhere(new Brackets(qb => {
              sdgBenefitsArray.forEach((benefit, index) => {
                if (index === 0) {
                  qb.where(`d.SDGBenefits ILIKE :benefit${index}`, { [`benefit${index}`]: `%${benefit}%` });
                } else {
                  qb.orWhere(`d.SDGBenefits ILIKE :benefit${index}`, { [`benefit${index}`]: `%${benefit}%` });
                }
              });
            }));

          }
          if (filterDto.fromAmountread && filterDto.toAmountread) {
            qb.orWhere("dg_log.readvalue_watthour BETWEEN :fromAmountread  AND :toAmountread", { fromAmountread: filterDto.fromAmountread, toAmountread: filterDto.toAmountread })
          }
          if (filterDto.fromAmountread != null && filterDto.toAmountread === undefined) {
            qb.orWhere("dg_log.readvalue_watthour > :fromAmountread", { fromAmountread: filterDto.fromAmountread })
          }
          if (filterDto.fromAmountread === undefined && filterDto.toAmountread != null) {
            qb.orWhere("dg_log.readvalue_watthour < :toAmountread", { toAmountread: filterDto.toAmountread })
          }
        }));

    })
    const totalCountQuery = await queryBuilder.getRawMany();
    const groupedDatasql = await queryBuilder.offset(skip).limit(pageSize).getSql();
    console.log(groupedDatasql);
    const groupedData = await queryBuilder.offset(skip).limit(pageSize).getRawMany();
    const totalCount = totalCountQuery.length;
    console.log("totalCountQuery", totalCount);
    const totalPages = Math.ceil(totalCount / pageSize);


    console.log(totalPages);
    let deviceGroups: any;
    if (role === 'OrganizationAdmin') {
      deviceGroups = groupedData.reduce((acc, curr) => {

        const existing = acc.find(item => item.dg_id === curr.devicegroupid);

        if (existing) {
          let newobj = {};

          const existing1 = acc.find(item => item.id === curr.id);
          if (existing1) {
            existing.developerdeviceIds.push(curr.id);
          }
          existing.internalCertificateId.push(curr.internalCertificateId)

        } else {

          acc.push({
            dg_id: curr.devicegroupid,
            name: curr.name,
            deviceIdsInt: curr.deviceIdsInt,
            // deviceIdsInt: curr.deviceIdsInt,
            developerdeviceIds: [curr.id],
            internalCertificateId: [curr.internalCertificateId]
          });

        }
        return acc;
      }, []);
    }
    if (role === 'Buyer') {
      deviceGroups = groupedData.reduce((acc, curr) => {

        const existing = acc.find(item => item.dg_id === curr.devicegroupid);

        if (existing) {
          existing.internalCertificateId.push(curr.internalCertificateId)
        } else {

          acc.push({
            dg_id: curr.devicegroupid,
            name: curr.name,
            deviceIdsInt: curr.deviceIdsInt,
            internalCertificateId: [curr.internalCertificateId]
          });

        }
        return acc;
      }, []);
    }

    const response = {
      deviceGroups,
      pageNumber,
      totalPages,
      totalCount
    };
    return response;
  }
  async getoldReservationInforDeveloperBsise(orgId, role, filterDto, pageNumber): Promise<any> {
    const pageSize = 10;
    // const pageNumber = 2
    if (pageNumber <= 0) {
      throw new HttpException('Invalid page number', HttpStatus.BAD_REQUEST);
    }

    const skip = (pageNumber - 1) * pageSize;
    console.log(skip)

    let queryBuilder: any;
    queryBuilder = this.repository.createQueryBuilder('dg')
      .innerJoin(Device, 'd', 'd.id = ANY(dg.deviceIdsInt)')
      .innerJoin(
        CheckCertificateIssueDateLogForDeviceGroupEntity,
        'dg_log',
        'dg_log.groupId = dg.id'
      )
      .innerJoin(Certificate, 'issuer', 'CAST(issuer.deviceId AS INTEGER) = dg.id')
      .select('DISTINCT ON (dg.id, issuer.id) dg.id AS deviceGroupId, dg.name, dg.deviceIdsInt, d.*, dg_log.readvalue_watthour, issuer.id')
      .orderBy('dg.id, issuer.id, dg_log.readvalue_watthour', 'ASC')

    queryBuilder.where((qb) => {
      let where_orgnaizationId: any;
      if (role === 'OrganizationAdmin') {
        where_orgnaizationId = qb.where(`d.organizationId = :orgId`, { orgId: orgId })
      }
      if (role === 'Buyer') {
        where_orgnaizationId = qb.where(`dg.organizationId = :orgId`, { orgId: orgId })
      }

      where_orgnaizationId
        .andWhere('EXISTS(SELECT 1 FROM jsonb_array_elements_text(CAST(issuer.metadata  AS jsonb)->\'deviceIds\') AS ids(deviceId) WHERE CAST(ids.deviceId AS INTEGER) = d.id)')
        .andWhere(new Brackets(qb => {
          if (filterDto.country) {
            const string = filterDto.country;
            const values = string.split(",");
            console.log(values);
            let CountryInvalid = false;
            filterDto.country = filterDto.country.toUpperCase();
            if (filterDto.country && typeof filterDto.country === "string" && filterDto.country.length === 3) {
              let countries = countryCodesList;
              if (countries.find(ele => ele.countryCode === filterDto.country) === undefined) {
                CountryInvalid = true;
              }
            }

            if (!CountryInvalid) {
              const newCountry = filterDto.country.toString()
              console.log(typeof newCountry)
              const CountryArray = newCountry.split(',');
              qb.orWhere(new Brackets(qb => {

                CountryArray.forEach((country, index) => {
                  if (index === 0) {
                    qb.where(`d.countryCode ILIKE :benefit${index}`, { [`benefit${index}`]: `%${country}%` });
                  } else {
                    qb.orWhere(`d.countryCode ILIKE :benefit${index}`, { [`benefit${index}`]: `%${country}%` });
                  }
                });
              }));

              // qb.orWhere('d.countryCode LIKE = :countrycode', { countrycode: `%${filterDto.country}%` });

            }
          }
          if ((filterDto.fuelCode)) {
            console.log(typeof filterDto.fuelCode);
            console.log(typeof filterDto.fuelCode);
            const newfuelCode = filterDto.fuelCode.toString()
            console.log(typeof newfuelCode)
            const fuelCodeArray = newfuelCode.split(',');
            qb.orWhere(new Brackets(qb => {

              fuelCodeArray.forEach((fuelCode, index) => {
                if (index === 0) {
                  qb.where(`d.fuelCode ILIKE :fuelcode${index}`, { [`fuelcode${index}`]: `%${fuelCode}%` });
                } else {
                  qb.orWhere(`d.fuelCode ILIKE :fuelcode${index}`, { [`fuelcode${index}`]: `%${fuelCode}%` });
                }
              });
            }));
            //  qb.orWhere(`d.fuelCode LIKE = :fuelcode`,  `%${filterDto.fuelCode}%`);

          }
          if (filterDto.offTaker) {
            // console.log(typeof filterDto.offTaker);
            const newoffTaker = filterDto.offTaker.toString()
            console.log(typeof newoffTaker)
            const offTakerArray = newoffTaker.split(',');
            qb.orWhere(new Brackets(qb => {

              offTakerArray.forEach((offTaker, index) => {
                if (index === 0) {
                  qb.where(`d.offTaker ILIKE :offtaker${index}`, { [`offtaker${index}`]: `%${offTaker}%` });
                } else {
                  qb.orWhere(`d.offTaker ILIKE :offtaker${index}`, { [`offtaker${index}`]: `%${offTaker}%` });
                }
              });
            }));
            // qb.orWhere('d.offTakers LIKE = :offTaker',  `%${filterDto.offTaker}%`);

          }
          const startTimestamp = new Date(filterDto.start_date).getTime() / 1000;
          const endTimestamp = new Date(filterDto.end_date).getTime() / 1000;
          if (filterDto.start_date && filterDto.end_date === undefined) {
            qb.orWhere("issuer.generationStartTime > :certificateStartDate ", { certificateStartDate: startTimestamp })
          }
          if (filterDto.end_date && filterDto.start_date === undefined) {
            qb.orWhere("issuer.generationEndTime  <:certificateEndDate", { certificateEndDate: endTimestamp })
          }
          if (filterDto.start_date && filterDto.end_date) {
            qb.orWhere("issuer.generationStartTime BETWEEN :certificateStartDate1  AND :certificateEndDate1", { certificateStartDate1: startTimestamp, certificateEndDate1: endTimestamp })
          }
          if (filterDto.SDGBenefits) {
            console.log(filterDto.SDGBenefits);

            const newsdg = filterDto.SDGBenefits.toString()
            console.log(typeof newsdg)
            const sdgBenefitsArray = newsdg.split(',');
            const sdgBenefitString = sdgBenefitsArray.map((benefit) => benefit).join(',');
            qb.orWhere(new Brackets(qb => {
              sdgBenefitsArray.forEach((benefit, index) => {
                if (index === 0) {
                  qb.where(`d.SDGBenefits ILIKE :benefit${index}`, { [`benefit${index}`]: `%${benefit}%` });
                } else {
                  qb.orWhere(`d.SDGBenefits ILIKE :benefit${index}`, { [`benefit${index}`]: `%${benefit}%` });
                }
              });
            }));

          }
          if (filterDto.fromAmountread && filterDto.toAmountread) {
            qb.orWhere("dg_log.readvalue_watthour BETWEEN :fromAmountread  AND :toAmountread", { fromAmountread: filterDto.fromAmountread, toAmountread: filterDto.toAmountread })
          }
          if (filterDto.fromAmountread != null && filterDto.toAmountread === undefined) {
            qb.orWhere("dg_log.readvalue_watthour > :fromAmountread", { fromAmountread: filterDto.fromAmountread })
          }
          if (filterDto.fromAmountread === undefined && filterDto.toAmountread != null) {
            qb.orWhere("dg_log.readvalue_watthour < :toAmountread", { toAmountread: filterDto.toAmountread })
          }
        }));

    })
    const totalCountQuery = await queryBuilder.getRawMany();
    const groupedDatasql = await queryBuilder.offset(skip).limit(pageSize).getSql();
    console.log(groupedDatasql);
    const groupedData = await queryBuilder.offset(skip).limit(pageSize).getRawMany();
    const totalCount = totalCountQuery.length;
    console.log("totalCountQuery", totalCount);
    const totalPages = Math.ceil(totalCount / pageSize);

    // if (pageNumber > totalPages) {
    //   throw new HttpException('Page number out of range', HttpStatus.NOT_FOUND);
    // }
    console.log(totalPages);


    console.log(groupedData)
    let deviceGroups = groupedData.reduce((acc, curr) => {
      const existing = acc.find(item => item.dg_id === curr.dg_id);
      if (existing) {
        let newobj = {};
        const existing1 = acc.find(item => item.id === curr.id);
        if (existing1) {
          existing.developerdeviceIds.push(curr.id);
        }
        existing.internalCertificateId.push(curr.id)
        // existing.certificatelog.push(newobj);
      } else {
        acc.push({
          dg_id: curr.devicegroupid,
          name: curr.name,
          deviceIdsInt: curr.deviceIdsInt,
          // deviceIdsInt: curr.deviceIdsInt,
          developerdeviceIds: [curr.id],
          internalCertificateId: [curr.id]
        });
        // console.log(acc);
      }
      return acc;
    }, []);
    // const totalPages = 10;
    const response = {
      deviceGroups,
      pageNumber,
      totalPages,
      totalCount
    };
    return response;
  }

  public async checkdeveloperorganization(deviceIds: number[], organizationId: number) : Promise<any> {
    const isMyDevice =  await Promise.all(await deviceIds.map(async(deviceId) => {
      const device = await this.deviceService.findOne(Number(deviceId));
      console.log("Within funuction:", typeof(device.organizationId), typeof(organizationId));
      return device.organizationId === Number(organizationId);
    }));
    
    return isMyDevice.some((result) => result);
  }

  async getAllCSVJobsForApiUser(apiuserId: string, organizationId?: number, pageNumber?: number, limit?: number): Promise<{ csvJobs: Array<DeviceCsvFileProcessingJobsEntity>, currentPage: number, totalPages: number, totalCount: number } | any> {
    let query : SelectQueryBuilder<DeviceCsvFileProcessingJobsEntity> = await this.repositoyCSVJobProcessing
      .createQueryBuilder('csvjobs')
      .orderBy('csvjobs.createdAt', 'DESC');
 
    if(apiuserId) {
        query.andWhere(`csvjobs.api_user_id = '${apiuserId}'`);
      }
 
    if(organizationId) {
      query.andWhere(`csvjobs.organizationId = '${organizationId}'`);
    }

    const [csvjobs, totalCount] = await query
        .skip((pageNumber - 1) * limit)
        .take(limit)
        .getManyAndCount();

    const totalPages = Math.ceil(totalCount / limit);
 
    const csvjobsWithOrganization = await Promise.all(
      csvjobs.map(async (csvjob: DeviceCsvFileProcessingJobsEntity) => {
        const organization = await this.organizationService.findOne(
          csvjob.organizationId,
        );
        //@ts-ignore
        csvjob.organization = {
          name: organization.name,
        };
        return csvjob;
      }),
    );
 
    return {
      csvJobs: csvjobsWithOrganization,
      currentPage: pageNumber,
      totalPages,
      totalCount
    }
  }
}