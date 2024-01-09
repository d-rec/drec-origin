import {
  Injectable,
  Logger,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { CheckCertificateIssueDateLogForDeviceEntity } from '../device/check_certificate_issue_date_log_for_device.entity'
import { getManager, Repository, IsNull, Not, Brackets, SelectQueryBuilder, EntityManager } from 'typeorm';
import { FilterDTO } from './dto/filter.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Device } from '../device/device.entity';
import { Certificate } from '@energyweb/issuer-api';
import { DeviceService } from '../device/device.service';
import { CertificateNewWithPerDeviceLog, CertificateWithPerdevicelog, CertificatelogResponse } from './dto'
import { DeviceGroupService } from '../device-group/device-group.service';
import { DeviceGroupDTO } from '../device-group/dto'
import { IGetAllCertificatesOptions, ICertificateReadModel } from '@energyweb/origin-247-certificate';
import { ICertificateMetadata } from '../../utils/types';
import { getLocalTimeZoneFromDevice } from '../../utils/localTimeDetailsForDevice';
import { CertificateReadModelEntity } from '@energyweb/origin-247-certificate/dist/js/src/offchain-certificate/repositories/CertificateReadModel/CertificateReadModel.entity';
import { DeviceGroup } from '../device-group/device-group.entity';
import { deviceFilterDTO } from './dto/deviceFilter.dto';
import { ILoggedInUser } from '../../models';
import { Role } from '../../utils/enums';
import * as fs from 'fs';
import { Response } from 'express';

export interface newCertificate extends Certificate {
  perDeviceCertificateLog: CheckCertificateIssueDateLogForDeviceEntity
}
@Injectable()
export class CertificateLogService {
  private readonly logger = new Logger(CertificateLogService.name);

  constructor(
    @InjectRepository(CheckCertificateIssueDateLogForDeviceEntity) private readonly repository: Repository<CheckCertificateIssueDateLogForDeviceEntity>,

    @InjectRepository(Certificate) private readonly certificaterrepository: Repository<Certificate>,

    @InjectRepository(CertificateReadModelEntity) private readonly cretificatereadmoduleRepository,

    private deviceService: DeviceService,
    private devicegroupService: DeviceGroupService,
  ) { }

  public async find(): Promise<CheckCertificateIssueDateLogForDeviceEntity[]> {
    this.logger.verbose(`With in find`);
    // const query = this.getFilteredQuery(filterDto);
    return this.repository.find();
  }


  public async findByGroupId(groupId: string): Promise<CheckCertificateIssueDateLogForDeviceEntity[]> {
    this.logger.verbose(`With in findByGroupId`);
    // const query = this.getFilteredQuery(filterDto);
    return this.repository.find({
      where: {
        groupId
      },
    });
  }

  //   private getFilteredQuery(filter: FilterDTO): FindManyOptions<CheckCertificateIssueDateLogForDeviceEntity> {
  //     const where: FindConditions<CheckCertificateIssueDateLogForDeviceEntity> = cleanDeep({

  //         certificate_issuance_startdate:
  //         filter.start_date &&
  //         filter.end_date &&
  //         Between(filter.start_date, filter.end_date),

  //     });
  //     const query: FindManyOptions<CheckCertificateIssueDateLogForDeviceEntity> = {
  //       where

  //     };
  //     return query;
  //   }

  //   private getFilteredQuery(filterDto: UserFilterDTO): SelectQueryBuilder<User> {
  //     const { organizationName, status } = filterDto;
  //     const query = this.repository
  //       .createQueryBuilder('user')
  //       .leftJoinAndSelect('user.organization', 'organization');
  //     if (organizationName) {
  //       const baseQuery = 'organization.name ILIKE :organizationName';
  //       query.andWhere(baseQuery, { organizationName: `%${organizationName}%` });
  //     }
  //     if (status) {
  //       query.andWhere(`user.status = '${status}'`);
  //     }
  //     return query;
  //   }

  async Findcertificatelog(filterDto: FilterDTO): Promise<CheckCertificateIssueDateLogForDeviceEntity[]> {
    this.logger.verbose(`With in Findcertificatelog`);
    const totalNumbers: any = getManager().createQueryBuilder()
      .select("d.externalId", "externalId")
      .addSelect("(COUNT(dl.id))", "total")
      .from(CheckCertificateIssueDateLogForDeviceEntity, "dl")
      .leftJoin(Device, "d", "dl.externalId = d.externalId")
      .where('d.organizationId = :orgid', { orgid: 3 })
      .andWhere("dl.readvalue_watthour>0")
      .groupBy("d.externalId");
    //console.log(totalExamNumbers.getQuery())
    const devicelog = await totalNumbers.getRawMany();
    //console.log(devicelog)

    return devicelog;

  }


  async getCertificateFromOldOrNewUfinction(groupid: string, pageNumber?: number): Promise<any> {
    this.logger.verbose(`With in getCertificateFromOldOrNewUfinction`);
    if (pageNumber === undefined || pageNumber === null) {
      pageNumber = 1;
    }
    let page = pageNumber; // Specify the page number you want to retrieve
    const itemsPerPage = 20; // Specify the number of items per page

    const [certifiedreservation, total] = await this.certificaterrepository.findAndCount({
      where: {
        deviceId: groupid,
      },
      order: {
        createdAt: 'DESC',
      },
      skip: (page - 1) * itemsPerPage,
      take: itemsPerPage,
    });
    const totalPages = Math.ceil(total / itemsPerPage);

    let request: IGetAllCertificatesOptions = {
      //@ts-ignore
      deviceId: parseInt(groupid)
    }

    const certifiedreservation1: ICertificateReadModel<ICertificateMetadata>[] = await this.cretificatereadmoduleRepository.find({
      where: {
        deviceId: groupid,
      },
      order: {
        createdAt: 'DESC',
      },
      skip: (page - 1) * itemsPerPage, // Calculate the number of items to skip based on the page number
      take: itemsPerPage, // Specify the number of items to take per page

    });
    const total1 = await this.cretificatereadmoduleRepository.find({
      where: {
        deviceId: groupid,
      },
    });
    const totalPages1 = Math.ceil(total1.length / itemsPerPage);

    if (certifiedreservation.length > 0) {
      const logdata = await this.getfindreservationcertified(certifiedreservation, groupid);
      const response = {
        certificatelog: logdata,
        totalItems: total,
        currentPage: page,
        totalPages: totalPages,
      };

      return response

    } else if (certifiedreservation1.length > 0) {
      const logdata1 = await this.getCertificatesUsingGroupIDVersionUpdateOrigin247(certifiedreservation1, groupid);
      const response2 = {
        certificatelog: logdata1,
        totalItems: total1.length,
        currentPage: page,
        totalPages: totalPages1,
      };

      return response2
    }
  }

  async getfindreservationcertified(certifiedreservation: Certificate[], groupid: string): Promise<CertificateWithPerdevicelog[]> {
    this.logger.verbose(`With in getfindreservationcertified`);
    const res = await Promise.all(
      certifiedreservation.map(async (certifiedlist: CertificateWithPerdevicelog) => {
        certifiedlist.certificateStartDate = new Date(certifiedlist.generationStartTime * 1000).toISOString();
        certifiedlist.certificateEndDate = new Date(certifiedlist.generationEndTime * 1000).toISOString();
        certifiedlist.perDeviceCertificateLog = [];

        try {
          JSON.parse(certifiedlist.metadata);
        }
        catch (e) {
          this.logger.error(e, `certificate doesnt contains valid metadta ${certifiedlist}`);
          return;
        }
        const obj = JSON.parse(certifiedlist.metadata);
        //console.log("getdate", certifiedlist.generationStartTime, certifiedlist.generationEndTime)
        /* Please see note below regarding generationStartTime
        node_modules\@energyweb\origin-247-certificate\dist\js\src\certificate.service.js
            async issue(params) {
            const command = {
                ...params,
                fromTime: Math.round(params.fromTime.getTime() / 1000),
                toTime: Math.round(params.toTime.getTime() / 1000)
            };
            const job = await this.blockchainActionsQueue.add({
                payload: command,
                type: types_1.BlockchainActionType.Issuance
            }, jobOptions);
            const result = await this.waitForJobResult(job);
            return this.mapCertificate(result);
            }
         */
        const devicereadstartdate = new Date((certifiedlist.generationStartTime - 1) * 1000);//as rounding when certificate is issued by EWFs package reference kept above and removing millseconds 
        const devicereadenddate = new Date((certifiedlist.generationEndTime + 1) * 1000);//going back 1 second in start and going forward 1 second in end

        await Promise.all(
          obj.deviceIds.map(async (deviceid: number) => {
            const device = await this.deviceService.findOne(deviceid);
            const devicelog = await this.getCheckCertificateIssueDateLogForDevice(parseInt(groupid), device.externalId, devicereadstartdate, devicereadenddate);
            devicelog.forEach(async (singleDeviceLogEle) => {
              singleDeviceLogEle.externalId = device.developerExternalId
              singleDeviceLogEle['timezone'] = getLocalTimeZoneFromDevice(device.createdAt, device);
              certifiedlist.perDeviceCertificateLog.push(singleDeviceLogEle);

            });

          })
        );

        return certifiedlist;
      }),
    );
    return res;
  }

  async getCertificatesUsingGroupIDVersionUpdateOrigin247(certifiedreservation, groupid: string): Promise<CertificateNewWithPerDeviceLog[]> {
    this.logger.verbose(`With in getCertificatesUsingGroupIDVersionUpdateOrigin247`);
    // let request: IGetAllCertificatesOptions = {
    //   deviceId: groupid
    // }
    // const certifiedreservation: ICertificateReadModel<ICertificateMetadata>[] = await this.offChainCertificateService.getAll(request);
    let certificatesInReservationWithLog: Array<CertificateNewWithPerDeviceLog> = [];
    certifiedreservation.forEach(ele => certificatesInReservationWithLog.push({ ...ele, perDeviceCertificateLog: [], certificateStartDate: '', certificateEndDate: '' }));

    await Promise.all(
      certifiedreservation.map(async (certifiedlist: ICertificateReadModel<ICertificateMetadata>, index: number) => {
        certificatesInReservationWithLog[index].certificateStartDate = new Date(certifiedlist.generationStartTime * 1000).toISOString();
        certificatesInReservationWithLog[index].certificateEndDate = new Date(certifiedlist.generationEndTime * 1000).toISOString();
        certificatesInReservationWithLog[index].perDeviceCertificateLog = [];
        try {
          if (typeof certifiedlist.metadata === "string") {
            let data = JSON.parse(certifiedlist.metadata);
          }
        }
        catch (e) {
          this.logger.error(e, `certificate doesnt contains valid metadata ${certifiedlist}`);
          return;
        }
        let obj;
        if (typeof certifiedlist.metadata === "string") {
          obj = JSON.parse(certifiedlist.metadata);
        }
        else {
          obj = certifiedlist.metadata;
        }
        let certificateTransactionUID = obj.certificateTransactionUID;
        //console.log("getdate", certifiedlist.generationStartTime, certifiedlist.generationEndTime)
        /* Below note can be ignored for newer certificates as we added certificateTransactionUID which will overcome this issue as well
        Please see note below regarding generationStartTime
        node_modules\@energyweb\origin-247-certificate\dist\js\src\certificate.service.js
            async issue(params) {
            const command = {
                ...params,
                fromTime: Math.round(params.fromTime.getTime() / 1000),
                toTime: Math.DeviceGroupound(params.toTime.getTime() / 1000)
            };
            const job = await this.blockchainActionsQueue.add({
                payload: command,
                type: types_1.BlockchainActionType.Issuance
            }, jobOptions);
            const result = await this.waitForJobResult(job);
            return this.mapCertificate(result);
            }
         */
        const devicereadstartdate = new Date((certifiedlist.generationStartTime - 1) * 1000);//as rounding when certificate is issued by EWFs package reference kept above and removing millseconds 
        const devicereadenddate = new Date((certifiedlist.generationEndTime + 1) * 1000);//going back 1 second in start and going forward 1 second in end

        await Promise.all(
          obj.deviceIds.map(async (deviceid: number) => {
            const device = await this.deviceService.findOne(deviceid);
            const devicelog = await this.getCheckCertificateIssueDateLogForDevice(parseInt(groupid), device.externalId, devicereadstartdate, devicereadenddate, certificateTransactionUID);
            devicelog.forEach(singleDeviceLogEle => {
              singleDeviceLogEle.externalId = device.developerExternalId
              singleDeviceLogEle['timezone'] = getLocalTimeZoneFromDevice(device.createdAt, device);

              certificatesInReservationWithLog[index].perDeviceCertificateLog.push(singleDeviceLogEle);
            });

            return devicelog;
          })
        );
        //console.log("perDeviceCertificateLog");
        return certificatesInReservationWithLog[index];
      }),
    );
    return certificatesInReservationWithLog;
  }

  public async getCheckCertificateIssueDateLogForDevice(groupId: number, deviceid: string,
    startDate: Date,
    endDate: Date, certificateTransactionUID?: string): Promise<CheckCertificateIssueDateLogForDeviceEntity[]> {
    this.logger.verbose(`With in getCheckCertificateIssueDateLogForDevice`);
    try {
      let devicelog;

      if (certificateTransactionUID) {
        devicelog = await this.getDevicelogFromTransactionUID(groupId, deviceid, certificateTransactionUID);
        return devicelog;
      }
      else {
        const query = this.getdevicelogFilteredQueryWithGroupID(groupId, deviceid,
          startDate,
          endDate);
        devicelog = await query.getRawMany();
      }
      const reservedevices = await devicelog.map((s: any) => {
        const item: any = {
          id: s.issuelog_id,
          certificate_issuance_startdate: s.issuelog_certificate_issuance_startdate,
          certificate_issuance_enddate: s.issuelog_certificate_issuance_enddate,
          readvalue_watthour: s.issuelog_readvalue_watthour,
          status: s.issuelog_status,
          // deviceid: s.issuelog_externalId,
          groupId: s.issuelog_groupId
        };
        return item;
      });
      return reservedevices;
    } catch (error) {
      this.logger.error(`Failed to retrieve device`, error.stack);
    }
  }
  private getdevicelogFilteredQueryWithGroupID(groupId: number, deviceid: string,
    startDate: Date,
    endDate: Date): SelectQueryBuilder<CheckCertificateIssueDateLogForDeviceEntity> {
    this.logger.verbose(`With in getdevicelogFilteredQueryWithGroupID`);
    const query = this.repository
      .createQueryBuilder("issuelog").
      where("issuelog.externalId = :deviceid", { deviceid: deviceid })
      .andWhere(
        new Brackets((db) => {
          db.where(
            new Brackets((db1) => {
              db1.where("issuelog.certificate_issuance_startdate BETWEEN :DeviceReadingStartDate1  AND :DeviceReadingEndDate1", { DeviceReadingStartDate1: startDate, DeviceReadingEndDate1: endDate })
                .orWhere("issuelog.certificate_issuance_startdate = :DeviceReadingStartDate", { DeviceReadingStartDate: startDate })
            })
          )
            .andWhere(
              new Brackets((db2) => {
                db2.where("issuelog.certificate_issuance_enddate  BETWEEN :DeviceReadingStartDate2  AND :DeviceReadingEndDate2", { DeviceReadingStartDate2: startDate, DeviceReadingEndDate2: endDate })
                  .orWhere("issuelog.certificate_issuance_enddate = :DeviceReadingEndDate ", { DeviceReadingEndDate: endDate })
              })
            )
        }),
      )
      .andWhere("issuelog.groupId = :groupId", { groupId: groupId })
    return query;
  }

  private getDevicelogFromTransactionUID(groupId: number, deviceId: string,
    certificateTransactionUID: string
  ): Promise<CheckCertificateIssueDateLogForDeviceEntity[]> {
    this.logger.verbose(`With in getDevicelogFromTransactionUID`);
    return this.repository.find(
      {
        where: {
          groupId: groupId,
          externalId: deviceId,
          certificateTransactionUID: certificateTransactionUID
        }
      })

  }


  async getCertificaterForRedemptionRepot(groupid: string): Promise<Certificate[]> {
    this.logger.verbose(`With in getCertificaterForRedemptionRepot`);
    const certifiedreservation = await this.certificaterrepository.find(
      {
        where: {
          deviceId: groupid,
          claims: Not(IsNull())
        }
      })
    return certifiedreservation;
  }
  async getCertificateRedemptionReport(buyerId: number): Promise<any[]> {
    this.logger.verbose(`With in getCertificateRedemptionReport`);
    const devicegroups = await this.devicegroupService.getBuyerDeviceGroups(buyerId);
    //console.log(devicegroups);
    const myredme = [];
    const res = await Promise.all(
      devicegroups.map(async (devicegroup: DeviceGroupDTO) => {
        const cert = await this.getCertificaterForRedemptionRepot(devicegroup.id.toString());
        //console.log(cert)
        const res1 = await Promise.all(
          cert.map(async (claimcertificate: Certificate) => {
            //console.log("datas")
            //console.log(claimcertificate);
            const res2 = await Promise.all(
              claimcertificate.claims.map(async (claims: any) => {
                // console.log(claims.claimData);

                myredme.push({
                  compliance: 'I-REC',
                  certificateId: claimcertificate.id,
                  fuelCode: devicegroup?.fuelCode.toString().split(','),
                  country: devicegroup?.countryCode.toString().split(','),
                  capacityRange: devicegroup?.capacityRange,
                  // installations: devicegroup?.installationConfigurations ? devicegroup?.installationConfigurations.join().replace(',', ', ') : '',
                  offTakers: devicegroup?.offTakers.join().replace(',', ' ,').toString().split(','),
                  // sectors: devicegroup?.sectors ? devicegroup?.sectors.join().replace(',', ', ') : '',
                  commissioningDateRange: devicegroup?.commissioningDateRange
                    .join().replace(',', ', '),
                  //standardCompliance: devicegroup?.standardCompliance,
                  redemptionDate: claims.claimData.periodStartDate.substring(claims.claimData.periodStartDate.indexOf(":") + 1),
                  certifiedEnergy: claims.value / 10 ** 6,
                  beneficiary: claims.claimData.beneficiary.substring(claims.claimData.beneficiary.indexOf(":") + 1),
                  beneficiary_address: claims.claimData.location.substring(claims.claimData.location.indexOf(":") + 1),
                  claimCoiuntryCode: claims.claimData.countryCode.substring(claims.claimData.countryCode.indexOf(":") + 1),
                  purpose: claims.claimData.purpose.substring(claims.claimData.purpose.indexOf(":") + 1)
                });
              }),
            );
          }),
        );

      }),
    );
    //console.log(res);
    return myredme;
  }


  // async getmissingtoken() {
  //   const grouploglist = grouplog;
  //   // console.log(grouploglist);
  //   const issuerlistlist = issuercertificatelog;
  //   //  console.log(issuerlistlist);
  //   const missingtoken = [];
  //   issuerlistlist.map((issuertoken: any) => {
  //     console.log("issuertoken");
  //     // console.log(issuertoken.owners);
  //     //let issuertokenvalue= JSON.parse(issuertoken.owners);
  //     var issuertokenvalue = JSON.parse(issuertoken.owners);
  //     //  console.log(issuertokenvalue);
  //     var value = issuertokenvalue["0x320Bbee0D0CE23302eDDb2707B2DdED3e49E4437"];
  //      console.log(value);
  //     // let firstKey = Object.keys(issuertokenvalue)[0];
  //     // let firstKeyValue = issuertokenvalue[firstKey];
  //     // issuertokenvalue[key]
  //     //   console.log(firstObj);
  //     //   let firstKey = Object.keys(firstObj);
  //     //   console.log(firstKey);
  //     //  // let issuertokenvalue = issuertoken.owners[firstKey];
  //     //   // let issuertokenvalue = Object.values(issuertoken.owners);
  //     // console.log(firstKeyValue);
  //     var foundEle =  grouploglist.find(ele => ele.readvalue_watthour != value);
  //     if(foundEle){
  //       missingtoken.push({
  //         token: foundEle.readvalue_watthour,
  //         foundEle
  //       });
  //     }


  //   });
  //   console.log(missingtoken);
  //   return missingtoken
  // }



  // async getsCertificateReadModule(userOrgId: string, generationStartTime, generationEndTime, pageNumber: number) {
  //   if (pageNumber <= 0) {
  //     throw new HttpException('Invalid page number', HttpStatus.BAD_REQUEST);
  //   }

  //   generationStartTime = new Date(generationStartTime).getTime() / 1000;
  //   generationEndTime = new Date(generationEndTime).getTime() / 1000;

  //   const queryBuilder = this.cretificatereadmoduleRepository.createQueryBuilder('certificate_read_module')
  //     .innerJoin('DeviceGroup', 'dg', 'certificate_read_module.deviceId = CAST(dg.Id AS character varying)')
  //     .andWhere('dg.organizationId = :userOrgId', { userOrgId });

  //   if (generationStartTime && generationEndTime) {
  //     queryBuilder.andWhere('certificate_read_module.generationStartTime <= :generationEndTime', {
  //       generationEndTime: generationEndTime,
  //     })
  //       .andWhere('certificate_read_module.generationEndTime >= :generationStartTime', {
  //         generationStartTime: generationStartTime,
  //       });
  //   }

  //   const limit = 10;
  //   const offset = (pageNumber - 1) * limit;

  //   const [results, totalCount] = await queryBuilder
  //     .skip(offset)
  //     .take(limit)
  //     .getManyAndCount();

  //   const totalPages = Math.ceil(totalCount / limit);

  //   if (pageNumber > totalPages) {
  //     throw new HttpException('Page number out of range', HttpStatus.NOT_FOUND);
  //   }

  //   for (const result of results) {
  //     const deviceGroup = await this.deviceGroupRepository.findOne({ id: result.deviceId });
  //     result.deviceGroup = deviceGroup;

  //     // Parse metadata as JSON
  //     result.metadata = JSON.parse(result.metadata);
  //   }

  //   return {
  //     "results": results,
  //     "pageNumber": pageNumber,
  //     "totalPages": totalPages,
  //   };
  // }

  //  @Cron(CronExpression.EVERY_30_SECONDS)
  async getsCertificateReadModule(userOrgId: string, pageNumber: number, deviceFilter: deviceFilterDTO, generationStartTime?: string, generationEndTime?: string, targetVolumeCertificateGenerationRequestedInMegaWattHour?: number) {
    this.logger.verbose(`With in getsCertificateReadModule`);
    const pageSize = 3;

    if (pageNumber <= 0) {
      throw new HttpException('Invalid page number', HttpStatus.BAD_REQUEST);
    }

    const skip = (pageNumber - 1) * pageSize;

    let queryBuilder = this.cretificatereadmoduleRepository.createQueryBuilder('crm')
      .innerJoin(DeviceGroup, 'dg', 'crm.deviceId = dg.id::text')
      .andWhere('dg.organizationId = :userOrgId', { userOrgId })
      .skip(skip)
      .take(pageSize);
    if (generationStartTime && generationEndTime) {
      const startTimestamp = new Date(generationStartTime).getTime() / 1000;
      const endTimestamp = new Date(generationEndTime).getTime() / 1000;

      queryBuilder = queryBuilder.andWhere('crm.generationStartTime <= :endTimestamp', { endTimestamp })
        .andWhere('crm.generationEndTime >= :startTimestamp', { startTimestamp });
    } else if (generationStartTime) {
      const startTimestamp = new Date(generationStartTime).getTime() / 1000;

      queryBuilder = queryBuilder.andWhere('crm.generationStartTime <= :startTimestamp', { startTimestamp });
    } else if (generationEndTime) {
      const endTimestamp = new Date(generationEndTime).getTime() / 1000;

      queryBuilder = queryBuilder.andWhere('crm.generationEndTime >= :endTimestamp', { endTimestamp });
    }

    if (targetVolumeCertificateGenerationRequestedInMegaWattHour !== undefined) {
      queryBuilder = queryBuilder.andWhere('dg.targetVolumeCertificateGenerationRequestedInMegaWattHour <= :targetVolume', { targetVolume: targetVolumeCertificateGenerationRequestedInMegaWattHour });
    }

    this.logger.debug("BEFORE QUERY:::::::::::::::::::::" + new Date());
    const results = await queryBuilder.getRawMany();
    const count = await queryBuilder.getCount();
    this.logger.debug("AFTER QUERY:::::::::::::::::::::" + new Date());

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
    groupId: number, deviceId: string
  ): Promise<CheckCertificateIssueDateLogForDeviceEntity> {
    this.logger.verbose(`With in getLastCertifiedDevicelogBYgroupId`);
    return this.repository.findOne(
      {
        where: {
          groupId: groupId,
          deviceid: deviceId,

        },
        order: {
          certificate_issuance_enddate: 'DESC'
        }
      })
  }

  //add function to get the certified log which device of developer added in reservation for developer

  async getCertifiedlogofDevices(user: ILoggedInUser, filterDto: FilterDTO, pageNumber) {
    this.logger.verbose(`With in getCertifiedlogofDevices`);
    const getnewreservationinfo = await this.devicegroupService.getReservationInforDeveloperBsise(user.organizationId, user.role, filterDto, pageNumber, user.api_user_id)
    this.logger.debug("getnewreservationinfo", getnewreservationinfo.deviceGroups.length);
    const getoldreservationinfo = await this.devicegroupService.getoldReservationInforDeveloperBsise(user.organizationId, user.role, filterDto, pageNumber, user.api_user_id)
    this.logger.debug("getoldreservationinfo", getoldreservationinfo.deviceGroups.length);
    let oldcertificates;
    if (getoldreservationinfo.deviceGroups.length > 0) {
      //  oldcertificates= await this.getDeveloperfindreservationcertified(getoldreservationinfo, user.role);
      return this.getDeveloperfindreservationcertified(getoldreservationinfo, user.role);
    }
    let newcertificates;
    if (getnewreservationinfo.deviceGroups.length > 0) {
      // newcertificates = await this.getDeveloperCertificatesUsingGroupIDVersionUpdateOrigin247(getnewreservationinfo, user.role);
      this.logger.debug("Line No: 580");
      return this.getDeveloperCertificatesUsingGroupIDVersionUpdateOrigin247(getnewreservationinfo, user.role);
    }
    //  const final= [...oldcertificates.certificatelog, ...newcertificates.certificatelog]
    return {
      certificatelog: [],
      currentpage: 0,
      totalPages: 0,
      totalCount: 0
    }
  }



  async getDeveloperfindreservationcertified(certifiedreservation, role): Promise<CertificatelogResponse> {

    let finalcertificatesInReservationWithLog: Array<any> = [];
    this.logger.verbose(`With in getDeveloperfindreservationcertified`);
    await Promise.all(
      certifiedreservation.deviceGroups.map(async (group: any, index: number) => {
        let newq = await this.certificaterrepository
          .createQueryBuilder('issuar')
          .where(`issuar.id IN (${JSON.stringify(group.internalCertificateId).replace(/[\[\]]/g, '')})`)

        const groupedDatasql = await newq.getQuery();
        this.logger.debug(groupedDatasql);
        const result = await newq.getMany();
        // console.log(result)
        const res = await Promise.all(
          result.map(async (certifiedlist: CertificateWithPerdevicelog) => {

            certifiedlist.certificateStartDate = new Date(certifiedlist.generationStartTime * 1000).toISOString();
            certifiedlist.certificateEndDate = new Date(certifiedlist.generationEndTime * 1000).toISOString();
            certifiedlist.perDeviceCertificateLog = [];

            try {
              JSON.parse(certifiedlist.metadata);
            }
            catch (e) {
              this.logger.error(e, `certificate doesnt contains valid metadta ${certifiedlist}`);
              return;
            }
            const obj = JSON.parse(certifiedlist.metadata);

            const devicereadstartdate = new Date((certifiedlist.generationStartTime - 1) * 1000);//as rounding when certificate is issued by EWFs package reference kept above and removing millseconds 
            const devicereadenddate = new Date((certifiedlist.generationEndTime + 1) * 1000);//going back 1 second in start and going forward 1 second in end
            //console.log("changegetdate", devicereadstartdate, devicereadenddate)
            await Promise.all(
              obj.deviceIds.map(async (deviceid: number) => {

                const device = await this.deviceService.findOne(deviceid);

                let devicelog;
                if (role === 'OrganizationAdmin') {
                  if (group.developerdeviceIds.find(ele => ele === deviceid)) {
                    this.logger.log("oldlog exist in developer");
                    const devicelog = await this.getCheckCertificateIssueDateLogForDevice(parseInt(group.dg_id), device.externalId, devicereadstartdate, devicereadenddate);
                    devicelog.forEach(singleDeviceLogEle => {
                      singleDeviceLogEle.externalId = device.developerExternalId
                      singleDeviceLogEle['deviceId'] = device.id
                      // if (device.timezone != null) {
                      //   singleDeviceLogEle['timezone'] = device.timezone
                      // }
                      singleDeviceLogEle['timezone'] = getLocalTimeZoneFromDevice(device.createdAt, device);
                      certifiedlist.perDeviceCertificateLog.push(singleDeviceLogEle);
                    });
                  }
                  else {
                    this.logger.log("oldlog doesn't exist in developer");
                    let totalvalue;
                    const devicelog = await this.getCheckCertificateIssueDateLogForDevice(parseInt(group.dg_id), device.externalId, devicereadstartdate, devicereadenddate);
                    if (devicelog.length > 0) {
                      const totalReadValue = devicelog.reduce(
                        (accumulator, currentValue) => accumulator + currentValue.readvalue_watthour,
                        0,
                      );
                      devicelog[0].readvalue_watthour = totalReadValue;
                      devicelog[0].externalId = 'Other Devices';
                      devicelog[0]['deviceId'] = 0
                      devicelog['timezone'] = getLocalTimeZoneFromDevice(device.createdAt, device);
                      certifiedlist.perDeviceCertificateLog.push(devicelog[0])

                    }

                  }
                }
                if (role === 'Buyer') {

                  devicelog = await this.getCheckCertificateIssueDateLogForDevice(parseInt(group.dg_id), device.externalId, devicereadstartdate, devicereadenddate);
                  devicelog.forEach(singleDeviceLogEle => {
                    singleDeviceLogEle.externalId = device.developerExternalId
                    singleDeviceLogEle['deviceId'] = device.id
                    singleDeviceLogEle['timezone'] = getLocalTimeZoneFromDevice(device.createdAt, device);
                    certifiedlist.perDeviceCertificateLog.push(singleDeviceLogEle);
                  });
                }

                //   return devicelog;
              })
            );
            finalcertificatesInReservationWithLog.push(certifiedlist)
            return certifiedlist;
          }),
        );

        return res;
      })
    )
    const response = {
      certificatelog: finalcertificatesInReservationWithLog,
      currentpage: certifiedreservation.pageNumber,
      totalPages: certifiedreservation.totalPages,
      totalCount: certifiedreservation.totalCount
    }
    return response;
    //return finalcertificatesInReservationWithLog
  }

  async getDeveloperCertificatesUsingGroupIDVersionUpdateOrigin247(getreservationinfo, role): Promise<CertificatelogResponse> {
    this.logger.verbose(`With in getDeveloperCertificatesUsingGroupIDVersionUpdateOrigin247`);
    let finalcertificatesInReservationWithLog: Array<any> = [];
    await Promise.all(
      getreservationinfo.deviceGroups.map(async (group: any, index: number) => {

        let newq = await this.cretificatereadmoduleRepository
          .createQueryBuilder('crm')
          .where(`crm.internalCertificateId IN (${JSON.stringify(group.internalCertificateId).replace(/[\[\]]/g, '')})`)
        const groupedDatasql = await newq.getQuery();
        this.logger.debug(groupedDatasql);
        const result = await newq.getMany();
        // console.log(result)
        let certificatesInReservationWithLog: Array<CertificateNewWithPerDeviceLog> = [];
        result.forEach(ele => certificatesInReservationWithLog.push({ ...ele, perDeviceCertificateLog: [], certificateStartDate: '', certificateEndDate: '' }));
        await Promise.all(
          result.map(async (certifiedlist: ICertificateReadModel<ICertificateMetadata>, index: number) => {
            certificatesInReservationWithLog[index].certificateStartDate = new Date(certifiedlist.generationStartTime * 1000).toISOString();
            certificatesInReservationWithLog[index].certificateEndDate = new Date(certifiedlist.generationEndTime * 1000).toISOString();
            certificatesInReservationWithLog[index].perDeviceCertificateLog = [];
            try {
              if (typeof certifiedlist.metadata === "string") {
                let data = JSON.parse(certifiedlist.metadata);
              }
            }
            catch (e) {
              this.logger.error(e, `certificate doesnt contains valid metadata ${certifiedlist}`);
              return;
            }

            let obj;
            if (typeof certifiedlist.metadata === "string") {
              obj = JSON.parse(certifiedlist.metadata);
            }
            else {
              obj = certifiedlist.metadata;
            }
            let certificateTransactionUID = obj.certificateTransactionUID;
            const devicereadstartdate = new Date((certifiedlist.generationStartTime - 1) * 1000);//as rounding when certificate is issued by EWFs package reference kept above and removing millseconds 
            const devicereadenddate = new Date((certifiedlist.generationEndTime + 1) * 1000);//going back 1 second in start and going forward 1 second in end
            await Promise.all(
              obj.deviceIds.map(async (deviceid: number) => {
                const device = await this.deviceService.findOne(deviceid);
                let devicelog;
                if (role === 'OrganizationAdmin') {
                  if (group.developerdeviceIds.find(ele => ele === deviceid)) {

                    devicelog = await this.getCheckCertificateIssueDateLogForDevice(parseInt(group.dg_id), device.externalId, devicereadstartdate, devicereadenddate, certificateTransactionUID);
                    devicelog.forEach(singleDeviceLogEle => {
                      singleDeviceLogEle.externalId = device.developerExternalId
                      singleDeviceLogEle['deviceId'] = device.id
                      singleDeviceLogEle['timezone'] = getLocalTimeZoneFromDevice(device.createdAt, device);

                      certificatesInReservationWithLog[index].perDeviceCertificateLog.push(singleDeviceLogEle);
                    });
                  }
                  else {
                    devicelog = await this.getCheckCertificateIssueDateLogForDevice(parseInt(group.dg_id), device.externalId, devicereadstartdate, devicereadenddate, certificateTransactionUID);
                    if (devicelog.length > 0) {
                      const totalReadValue = devicelog.reduce(
                        (accumulator, currentValue) => accumulator + currentValue.readvalue_watthour,
                        0,
                      );
                      devicelog[0].readvalue_watthour = totalReadValue;
                      devicelog[0].externalId = 'Other Devices'
                      devicelog[0]['deviceId'] = 0
                      devicelog['timezone'] = getLocalTimeZoneFromDevice(device.createdAt, device);
                      certificatesInReservationWithLog[index].perDeviceCertificateLog.push(devicelog[0])
                    }
                  }
                }
                if (role === 'Buyer' || role === Role.ApiUser) {
                  devicelog = await this.getCheckCertificateIssueDateLogForDevice(parseInt(group.dg_id), device.externalId, devicereadstartdate, devicereadenddate, certificateTransactionUID);
                  devicelog.forEach(singleDeviceLogEle => {
                    singleDeviceLogEle.externalId = device.developerExternalId
                    singleDeviceLogEle['deviceId'] = device.id
                    singleDeviceLogEle['timezone'] = getLocalTimeZoneFromDevice(device.createdAt, device);
                    certificatesInReservationWithLog[index].perDeviceCertificateLog.push(singleDeviceLogEle);
                  });
                }
                return devicelog;
              })
            );
            finalcertificatesInReservationWithLog.push(certificatesInReservationWithLog[index])
            return certificatesInReservationWithLog[index];
          }),
        );
      })
    )
    const response = {
      certificatelog: finalcertificatesInReservationWithLog,
      currentpage: getreservationinfo.pageNumber,
      totalPages: getreservationinfo.totalPages,
      totalCount: getreservationinfo.totalCount
    }
    return response;
    //return finalcertificatesInReservationWithLog
  }
  /**Create new function to get the certifcate log of perdevice */
  async Findperdevicecertificatelog(groupId, organizationId): Promise<CheckCertificateIssueDateLogForDeviceEntity[]> {
    this.logger.verbose(`With in Findcertificatelog`);
    const totalNumbers: any = getManager().createQueryBuilder()
      .select("d.developerExternalId", "externalId")
      .addSelect("dg.name", "reservation_name")
      .addSelect("dl.certificate_issuance_startdate", "certificate_issuance_startdate")
      .addSelect("dl.certificate_issuance_enddate", "certificate_issuance_enddate")
      .addSelect("dl.readvalue_watthour", "readvalue_watthour")
      .addSelect("dl.certificateTransactionUID", "certificateTransactionUID")
      .addSelect("crm.blockchainCertificateId", "blockchainCertificateId")
      .from(CheckCertificateIssueDateLogForDeviceEntity, "dl")
      .leftJoin(DeviceGroup, "dg", "dl.groupId = dg.id")
      .leftJoin(Device, "d", "dl.externalId = d.externalId")
      .innerJoin(
        CertificateReadModelEntity,
        'crm',
        'dl.certificateTransactionUID = (crm.metadata::jsonb)->>\'certificateTransactionUID\''
      )
      .where('dl.groupId = :groupId', { groupId: groupId })
      .andWhere('dg.organizationId = :organizationId', { organizationId: organizationId })
      .andWhere("dl.readvalue_watthour>0");

    //console.log(totalExamNumbers.getQuery())
    const devicelog = await totalNumbers.getRawMany();
    //console.log(devicelog)

    return devicelog;

  }
  

  async createCSV(res: Response, groupId: number, organizationId: number, name: string) {
    try {
      const data = await this.Findperdevicecertificatelog(groupId, organizationId);
      this.logger.error(`Error generating CSV: ${data[0]}`);
      const headers = Object.keys(data[0]);
      if(headers!==undefined){
      res.setHeader('Content-Disposition', 'attachment; filename=' + name + ' ' + new Date().toLocaleDateString() + '.csv');
      res.setHeader('Content-Type', 'text/csv');
      const csvString = `${headers.join(',')}\n${data.map(obj => headers.map(key => obj[key]).join(',')).join('\n')}`;
      // Stream the CSV string to the response
      res.write(csvString, 'utf-8', () => {
        this.logger.log('The CSV file streamed successfully!');
        res.end();
      });
    }
    } catch (error) {
      this.logger.error(`Error generating CSV: ${error.message}`);
      //res.status(500).send('Internal Server Error');
      throw new HttpException('Devices log Not found', HttpStatus.NOT_FOUND);
    }
    //return `CSV file generated at ${filePath}`;
  }

}
