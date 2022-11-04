
import {
  Injectable,
  NotFoundException,
  NotAcceptableException,
  Logger,
  ConflictException,
} from '@nestjs/common';
import { CheckCertificateIssueDateLogForDeviceEntity } from '../device/check_certificate_issue_date_log_for_device.entity'
import { getManager, FindOneOptions, Repository, In, IsNull, Not, Brackets, SelectQueryBuilder, FindConditions, FindManyOptions, Between, LessThanOrEqual } from 'typeorm';
import { FilterDTO } from './dto/filter.dto';
import { InjectRepository } from '@nestjs/typeorm';
import cleanDeep from 'clean-deep';
import { Device } from '../device/device.entity';
import { Certificate } from '@energyweb/issuer-api';
import { DeviceService } from '../device/device.service';
import { DateTime } from 'luxon';
import { CertificateWithPerdevicelog } from './dto'
export interface newCertificate extends Certificate {
  perDeviceCertificateLog: CheckCertificateIssueDateLogForDeviceEntity
}
@Injectable()
export class CertificateLogService {
  private readonly logger = new Logger(CertificateLogService.name);

  constructor(
    @InjectRepository(CheckCertificateIssueDateLogForDeviceEntity) private readonly repository: Repository<CheckCertificateIssueDateLogForDeviceEntity>,

    @InjectRepository(Certificate) private readonly certificaterrepository: Repository<Certificate>,
    private deviceService: DeviceService,
  ) { }

  public async find(): Promise<CheckCertificateIssueDateLogForDeviceEntity[]> {
    // const query = this.getFilteredQuery(filterDto);
    return this.repository.find();
  }


  public async findByGroupId(groupId: string): Promise<CheckCertificateIssueDateLogForDeviceEntity[]> {
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
    const totalExamNumbers: any = getManager().createQueryBuilder()
      .select("d.externalId", "externalId")
      .addSelect("(COUNT(dl.id))", "total")
      .from(CheckCertificateIssueDateLogForDeviceEntity, "dl")
      .leftJoin(Device, "d", "dl.deviceid = d.externalId")
      .where('d.organizationId = :orgid', { orgid: 3 })
      .andWhere("dl.readvalue_watthour>0")
      .groupBy("d.externalId");
    console.log(totalExamNumbers.getQuery())
    const devicelog = await totalExamNumbers.getRawMany();
    console.log(devicelog)

    return devicelog;

  }


  async getfindreservationcertified(groupid: string): Promise<CertificateWithPerdevicelog[]> {
    const certifiedreservation = await this.certificaterrepository.find(
      {
        where: {
          deviceId: groupid

        }
      })
    //console.log(certifiedreservation);

    const res = await Promise.all(
      certifiedreservation.map(async (certifiedlist: CertificateWithPerdevicelog) => {

        try
        {
          JSON.parse(certifiedlist.metadata);
        }
        catch(e)
        {
          console.error(e,"certificate doesnt contains valid metadta",certifiedlist);
          return;
        }


        const obj = JSON.parse(certifiedlist.metadata);
        console.log("getdate", certifiedlist.generationStartTime, certifiedlist.generationEndTime)
        const devicereadstartdate = new Date(certifiedlist.generationStartTime * 1000);
        const devicereadenddate = new Date(certifiedlist.generationEndTime * 1000);
        console.log("changegetdate", devicereadstartdate, devicereadenddate)
        await Promise.all(
          obj.deviceIds.map(async (deviceid: number) => {

            const device = await this.deviceService.findOne(deviceid);
            const devicelog = await this.getCheckCertificateIssueDateLogForDevice(parseInt(groupid), device.externalId, devicereadstartdate, devicereadenddate)
            console.log(devicelog);
            
            certifiedlist.perDeviceCertificateLog=devicelog;
            console.log(certifiedlist)
            return devicelog ;

          })
        );
        console.log("perDeviceCertificateLog");
       
        return certifiedlist;
          
        
      }),
    );
    console.log("res")
    console.log(res);
    return res;
  }
  public async getCheckCertificateIssueDateLogForDevice(groupId: number, deviceid: string,
    startDate: Date,
    endDate: Date): Promise<CheckCertificateIssueDateLogForDeviceEntity[]> {
    const query = this.getdevicelogFilteredQueryWithGroupID(groupId, deviceid,
      startDate,
      endDate);
    // console.log(query);
    // console.log("devicequery");
    try {

      const devicelog = await query.getRawMany();
      // console.log("devicelog");
      // console.log(devicelog);
      const reservedevices = devicelog.map((s: any) => {
        const item: any = {
          id: s.issuelog_id,
          certificate_issuance_startdate:s.issuelog_certificate_issuance_startdate,
          certificate_issuance_enddate:s.issuelog_certificate_issuance_enddate,
          readvalue_watthour:s.issuelog_readvalue_watthour,       
          status: s.issuelog_status,        
          deviceid: s.issuelog_deviceid,    
          groupId:s.issuelog_groupId
        };
        return item;
      });

      return reservedevices;
    } catch (error) {
      console.log(error)
      this.logger.error(`Failed to retrieve device`, error.stack);
      //  throw new InternalServerErrorException('Failed to retrieve users');
    }
  }
  private getdevicelogFilteredQueryWithGroupID(groupId: number, deviceid: string,
    startDate: Date,
    endDate: Date): SelectQueryBuilder<CheckCertificateIssueDateLogForDeviceEntity> {
    //  const { organizationName, status } = filterDto;
    const query = this.repository
      .createQueryBuilder("issuelog").
      where("issuelog.deviceId = :deviceid", { deviceid: deviceid })
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
    console.log(query.getQuery())
    return query;
  }

}
