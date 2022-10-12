
import {
    Injectable,
    NotFoundException,
    NotAcceptableException,
    Logger,
    ConflictException,
  } from '@nestjs/common';
import {CheckCertificateIssueDateLogForDeviceEntity} from '../device/check_certificate_issue_date_log_for_device.entity'
import { getManager,FindOneOptions, Repository, In, IsNull, Not, Brackets, SelectQueryBuilder, FindConditions, FindManyOptions, Between, LessThanOrEqual } from 'typeorm';
import {FilterDTO} from './dto/filter.dto';
import { InjectRepository } from '@nestjs/typeorm';
import cleanDeep from 'clean-deep';
import {Device} from '../device/device.entity'
@Injectable()
export class CertificateLogService { 
    private readonly logger = new Logger(CertificateLogService.name);

    constructor(
    @InjectRepository(CheckCertificateIssueDateLogForDeviceEntity) private readonly repository: Repository<CheckCertificateIssueDateLogForDeviceEntity>,
    ){}
   
    public async find(filterDto: FilterDTO): Promise<CheckCertificateIssueDateLogForDeviceEntity[]> {
   // const query = this.getFilteredQuery(filterDto);
    return this.repository.find();
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
    // const organization = await this.repository.findOne({secretKey:secretKey});
    // if (!organization) {
    //   throw new NotFoundException(`No organization found with secretKey ${secretKey}`);
    // }
    // return organization;

//     const log = await this.repository
//       .createQueryBuilder('cert_log')
//       .leftJoinAndSelect('cert_log.deviceid', 'device')
//       .where('device.organizationId = :orgid', { orgid: 3 })
//       .andWhere('cert_log.readvalue_watthour >0')
//       .groupBy('device.externalId')
//       .getQuery();
// console.log(log)

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
    
    return  devicelog;
    
  }
}
