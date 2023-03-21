
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
import { DeviceGroupService } from '../device-group/device-group.service';
import { DeviceGroupDTO } from '../device-group/dto'
import { grouplog } from './grouplog';
import { issuercertificatelog } from './issuercertificate'
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
    private devicegroupService: DeviceGroupService,
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
    const certifiedreservation = [
      {
        "createdAt": "2023-01-21 18:59:02.444933+00",
        "updatedAt": "2023-01-21 18:59:12.707698+00",
        "id": 26,
        "deviceId": 9,
        "generationStartTime": 1664562601,
        "generationEndTime": 1667240999,
        "creationTime": 1674327530,
        "creationBlockHash": "0x608737bec1d4ba906efd9c0fd081ebaf9cf3da48f2f05e4b1c5f99991ae43fb5",
        "owners": {
          "0x320Bbee0D0CE23302eDDb2707B2DdED3e49E4437": "5066000"
        },
        "claimers": "NULL",
        "claims": "NULL",
        "latestCommitment": "NULL",
        "issuedPrivately": "FALSE",
        "blockchainNetId": 246,
        "metadata": {
          "version": "v1.0",
          "buyerReservationId": "95e06592-f52d-4acf-94d8-c5e655ff85c0",
          "isStandardIssuanceRequested": "I-REC",
          "type": "REC",
          "deviceIds": [
            12
          ],
          "groupId": "9"
        }
      },
      {
        "createdAt": "2023-01-21 19:00:39.324224+00",
        "updatedAt": "2023-01-21 19:00:39.324224+00",
        "id": 27,
        "deviceId": 9,
        "generationStartTime": 1648751401,
        "generationEndTime": 1651343399,
        "creationTime": 1674327615,
        "creationBlockHash": "0x9e8b930bc674ce0622232ddb00dea09ae15e952bc8f5e49afb4c5c9ea6119456",
        "owners": {
          "0x320Bbee0D0CE23302eDDb2707B2DdED3e49E4437": "2003700"
        },
        "claimers": "NULL",
        "claims": "NULL",
        "latestCommitment": "NULL",
        "issuedPrivately": "FALSE",
        "blockchainNetId": 246,
        "metadata": {
          "version": "v1.0",
          "buyerReservationId": "95e06592-f52d-4acf-94d8-c5e655ff85c0",
          "isStandardIssuanceRequested": "I-REC",
          "type": "REC",
          "deviceIds": [
            12
          ],
          "groupId": "9"
        }
      },
      {
        "createdAt": "2023-02-15 07:29:35.815382+00",
        "updatedAt": "2023-02-18 16:43:11.849743+00",
        "id": 28,
        "deviceId": 9,
        "generationStartTime": 1646073001,
        "generationEndTime": 1648751399,
        "creationTime": 1676358480,
        "creationBlockHash": "0xa3318a13466122d57d69f2daa049493c3684d5fea2cafa8e88d84a6acbc44f50",
        "owners": {
          "0x320Bbee0D0CE23302eDDb2707B2DdED3e49E4437": "5977900"
        },
        "claimers": "NULL",
        "claims": "NULL",
        "latestCommitment": "NULL",
        "issuedPrivately": "FALSE",
        "blockchainNetId": 246,
        "metadata": {
          "version": "v1.0",
          "buyerReservationId": "95e06592-f52d-4acf-94d8-c5e655ff85c0",
          "isStandardIssuanceRequested": "I-REC",
          "type": "REC",
          "deviceIds": [
            12
          ],
          "groupId": "9"
        }
      },
      {
        "createdAt": "2023-01-21 19:02:17.127285+00",
        "updatedAt": "2023-01-21 19:02:17.127285+00",
        "id": 29,
        "deviceId": 9,
        "generationStartTime": 1661970601,
        "generationEndTime": 1664562599,
        "creationTime": 1674327720,
        "creationBlockHash": "0xfb9f884b1ab1f7248d711b56f0ca7248baf25d41223577082d851773b9509ac0",
        "owners": {
          "0x320Bbee0D0CE23302eDDb2707B2DdED3e49E4437": "7159100"
        },
        "claimers": "NULL",
        "claims": "NULL",
        "latestCommitment": "NULL",
        "issuedPrivately": "FALSE",
        "blockchainNetId": 246,
        "metadata": {
          "version": "v1.0",
          "buyerReservationId": "95e06592-f52d-4acf-94d8-c5e655ff85c0",
          "isStandardIssuanceRequested": "I-REC",
          "type": "REC",
          "deviceIds": [
            12
          ],
          "groupId": "9"
        }
      },
      {
        "createdAt": "2023-01-21 19:03:49.212606+00",
        "updatedAt": "2023-01-21 19:03:49.212606+00",
        "id": 30,
        "deviceId": 9,
        "generationStartTime": 1659292201,
        "generationEndTime": 1661970599,
        "creationTime": 1674327810,
        "creationBlockHash": "0xc9d6d5155b15d33895c1cc75d27b4358d9cda5a05928d8564b5a3c8eb27daa4f",
        "owners": {
          "0x320Bbee0D0CE23302eDDb2707B2DdED3e49E4437": "5187100"
        },
        "claimers": "NULL",
        "claims": "NULL",
        "latestCommitment": "NULL",
        "issuedPrivately": "FALSE",
        "blockchainNetId": 246,
        "metadata": {
          "version": "v1.0",
          "buyerReservationId": "95e06592-f52d-4acf-94d8-c5e655ff85c0",
          "isStandardIssuanceRequested": "I-REC",
          "type": "REC",
          "deviceIds": [
            12
          ],
          "groupId": "9"
        }
      },
      {
        "createdAt": "2023-01-23 10:59:12.687065+00",
        "updatedAt": "2023-01-23 10:59:12.687065+00",
        "id": 32,
        "deviceId": 9,
        "generationStartTime": 1648751401,
        "generationEndTime": 1651343399,
        "creationTime": 1674471540,
        "creationBlockHash": "0x14dca3535390a853df6e2a45ec173c95baff1fb8629f3e3712155ba30e060e13",
        "owners": {
          "0x320Bbee0D0CE23302eDDb2707B2DdED3e49E4437": "2513300"
        },
        "claimers": "NULL",
        "claims": "NULL",
        "latestCommitment": "NULL",
        "issuedPrivately": "FALSE",
        "blockchainNetId": 246,
        "metadata": {
          "version": "v1.0",
          "buyerReservationId": "95e06592-f52d-4acf-94d8-c5e655ff85c0",
          "isStandardIssuanceRequested": "I-REC",
          "type": "REC",
          "deviceIds": [
            11
          ],
          "groupId": "9"
        }
      },
      {
        "createdAt": "2023-01-23 11:00:34.49206+00",
        "updatedAt": "2023-01-23 11:00:40.821891+00",
        "id": 33,
        "deviceId": 9,
        "generationStartTime": 1646073001,
        "generationEndTime": 1648751399,
        "creationTime": 1674471620,
        "creationBlockHash": "0xa42a0dfacb4d4beb879e53b56f85b69751c5eda6bc1aa37d155dd43cae4655e3",
        "owners": {
          "0x320Bbee0D0CE23302eDDb2707B2DdED3e49E4437": "2677400"
        },
        "claimers": "NULL",
        "claims": "NULL",
        "latestCommitment": "NULL",
        "issuedPrivately": "FALSE",
        "blockchainNetId": 246,
        "metadata": {
          "version": "v1.0",
          "buyerReservationId": "95e06592-f52d-4acf-94d8-c5e655ff85c0",
          "isStandardIssuanceRequested": "I-REC",
          "type": "REC",
          "deviceIds": [
            11
          ],
          "groupId": "9"
        }
      },
      {
        "createdAt": "2023-01-23 11:01:53.507644+00",
        "updatedAt": "2023-01-23 11:01:53.507644+00",
        "id": 34,
        "deviceId": 9,
        "generationStartTime": 1651343401,
        "generationEndTime": 1654021799,
        "creationTime": 1674471700,
        "creationBlockHash": "0x3595822cb7ef9052fcd72bb184388d7942376f4ae171997fb25383a0f294aba3",
        "owners": {
          "0x320Bbee0D0CE23302eDDb2707B2DdED3e49E4437": "2048800"
        },
        "claimers": "NULL",
        "claims": "NULL",
        "latestCommitment": "NULL",
        "issuedPrivately": "FALSE",
        "blockchainNetId": 246,
        "metadata": {
          "version": "v1.0",
          "buyerReservationId": "95e06592-f52d-4acf-94d8-c5e655ff85c0",
          "isStandardIssuanceRequested": "I-REC",
          "type": "REC",
          "deviceIds": [
            11
          ],
          "groupId": "9"
        }
      },
      {
        "createdAt": "2023-01-23 11:03:12.292232+00",
        "updatedAt": "2023-01-23 11:03:12.292232+00",
        "id": 35,
        "deviceId": 9,
        "generationStartTime": 1654021801,
        "generationEndTime": 1656613799,
        "creationTime": 1674471780,
        "creationBlockHash": "0x305cde14d4b8bb7217d594007816f01d2532d37ff763fcec77a3da9fdfe70dfe",
        "owners": {
          "0x320Bbee0D0CE23302eDDb2707B2DdED3e49E4437": "1752300"
        },
        "claimers": "NULL",
        "claims": "NULL",
        "latestCommitment": "NULL",
        "issuedPrivately": "FALSE",
        "blockchainNetId": 246,
        "metadata": {
          "version": "v1.0",
          "buyerReservationId": "95e06592-f52d-4acf-94d8-c5e655ff85c0",
          "isStandardIssuanceRequested": "I-REC",
          "type": "REC",
          "deviceIds": [
            11
          ],
          "groupId": "9"
        }
      },
      {
        "createdAt": "2023-01-23 11:04:44.60855+00",
        "updatedAt": "2023-01-23 11:04:44.60855+00",
        "id": 36,
        "deviceId": 9,
        "generationStartTime": 1656613801,
        "generationEndTime": 1659292199,
        "creationTime": 1674471865,
        "creationBlockHash": "0x4a05c427bee27c7ea38bf4e24b12fbf9007063d7deba1af7d6dd8b6ee3af6a8a",
        "owners": {
          "0x320Bbee0D0CE23302eDDb2707B2DdED3e49E4437": "1877100"
        },
        "claimers": "NULL",
        "claims": "NULL",
        "latestCommitment": "NULL",
        "issuedPrivately": "FALSE",
        "blockchainNetId": 246,
        "metadata": {
          "version": "v1.0",
          "buyerReservationId": "95e06592-f52d-4acf-94d8-c5e655ff85c0",
          "isStandardIssuanceRequested": "I-REC",
          "type": "REC",
          "deviceIds": [
            11
          ],
          "groupId": "9"
        }
      },
      {
        "createdAt": "2023-01-23 11:06:16.520458+00",
        "updatedAt": "2023-01-23 11:06:18.130206+00",
        "id": 37,
        "deviceId": 9,
        "generationStartTime": 1659292201,
        "generationEndTime": 1661970599,
        "creationTime": 1674471955,
        "creationBlockHash": "0x3c79400dfdb26cbe1cc5ef2d76509a87bd9cda3d8d1f7900fa4a3b2ef3f95bba",
        "owners": {
          "0x320Bbee0D0CE23302eDDb2707B2DdED3e49E4437": "2109800"
        },
        "claimers": "NULL",
        "claims": "NULL",
        "latestCommitment": "NULL",
        "issuedPrivately": "FALSE",
        "blockchainNetId": 246,
        "metadata": {
          "version": "v1.0",
          "buyerReservationId": "95e06592-f52d-4acf-94d8-c5e655ff85c0",
          "isStandardIssuanceRequested": "I-REC",
          "type": "REC",
          "deviceIds": [
            11
          ],
          "groupId": "9"
        }
      },
      {
        "createdAt": "2023-01-23 11:07:38.243091+00",
        "updatedAt": "2023-01-23 11:07:38.243091+00",
        "id": 38,
        "deviceId": 9,
        "generationStartTime": 1664562601,
        "generationEndTime": 1667240999,
        "creationTime": 1674472045,
        "creationBlockHash": "0x4507fc1761e0ae477f08c1bb5120c65cbc78d01114ad1f6a58e2ab8084149c4c",
        "owners": {
          "0x320Bbee0D0CE23302eDDb2707B2DdED3e49E4437": "2062100"
        },
        "claimers": "NULL",
        "claims": "NULL",
        "latestCommitment": "NULL",
        "issuedPrivately": "FALSE",
        "blockchainNetId": 246,
        "metadata": {
          "version": "v1.0",
          "buyerReservationId": "95e06592-f52d-4acf-94d8-c5e655ff85c0",
          "isStandardIssuanceRequested": "I-REC",
          "type": "REC",
          "deviceIds": [
            11
          ],
          "groupId": "9"
        }
      },
      {
        "createdAt": "2023-01-23 11:08:59.315803+00",
        "updatedAt": "2023-01-23 11:08:59.315803+00",
        "id": 39,
        "deviceId": 9,
        "generationStartTime": 1651343401,
        "generationEndTime": 1654021799,
        "creationTime": 1674472125,
        "creationBlockHash": "0x0d58a1e2c6fafbb3804b1c873266c986661fdf540f4942c30eb2ab8de5a2367a",
        "owners": {
          "0x320Bbee0D0CE23302eDDb2707B2DdED3e49E4437": "8324000"
        },
        "claimers": "NULL",
        "claims": "NULL",
        "latestCommitment": "NULL",
        "issuedPrivately": "FALSE",
        "blockchainNetId": 246,
        "metadata": {
          "version": "v1.0",
          "buyerReservationId": "95e06592-f52d-4acf-94d8-c5e655ff85c0",
          "isStandardIssuanceRequested": "I-REC",
          "type": "REC",
          "deviceIds": [
            10
          ],
          "groupId": "9"
        }
      },
      {
        "createdAt": "2023-01-23 11:10:17.211595+00",
        "updatedAt": "2023-01-23 11:10:17.211595+00",
        "id": 40,
        "deviceId": 9,
        "generationStartTime": 1654021801,
        "generationEndTime": 1656613799,
        "creationTime": 1674472205,
        "creationBlockHash": "0x403da7f710a00cccc40ab462e18a057d51bc5f5ea0c448bcc502209e2f2560fe",
        "owners": {
          "0x320Bbee0D0CE23302eDDb2707B2DdED3e49E4437": "9192000"
        },
        "claimers": "NULL",
        "claims": "NULL",
        "latestCommitment": "NULL",
        "issuedPrivately": "FALSE",
        "blockchainNetId": 246,
        "metadata": {
          "version": "v1.0",
          "buyerReservationId": "95e06592-f52d-4acf-94d8-c5e655ff85c0",
          "isStandardIssuanceRequested": "I-REC",
          "type": "REC",
          "deviceIds": [
            10
          ],
          "groupId": "9"
        }
      },
      {
        "createdAt": "2023-01-23 11:11:42.218607+00",
        "updatedAt": "2023-01-23 11:11:42.218607+00",
        "id": 41,
        "deviceId": 9,
        "generationStartTime": 1661970601,
        "generationEndTime": 1664562599,
        "creationTime": 1674472285,
        "creationBlockHash": "0xf8da62708760d173a246672e40ceca0826b7d8e5ae93086676101884ae5e33a0",
        "owners": {
          "0x320Bbee0D0CE23302eDDb2707B2DdED3e49E4437": "2479800"
        },
        "claimers": "NULL",
        "claims": "NULL",
        "latestCommitment": "NULL",
        "issuedPrivately": "FALSE",
        "blockchainNetId": 246,
        "metadata": {
          "version": "v1.0",
          "buyerReservationId": "95e06592-f52d-4acf-94d8-c5e655ff85c0",
          "isStandardIssuanceRequested": "I-REC",
          "type": "REC",
          "deviceIds": [
            11
          ],
          "groupId": "9"
        }
      },
      {
        "createdAt": "2023-01-23 11:13:11.518201+00",
        "updatedAt": "2023-01-23 11:13:11.518201+00",
        "id": 42,
        "deviceId": 9,
        "generationStartTime": 1656613801,
        "generationEndTime": 1659292199,
        "creationTime": 1674472375,
        "creationBlockHash": "0x58e08a9129da85292afd0364ce53c4e1453f6aa166ce0aa712fd3b2a5f77d269",
        "owners": {
          "0x320Bbee0D0CE23302eDDb2707B2DdED3e49E4437": "5458300"
        },
        "claimers": "NULL",
        "claims": "NULL",
        "latestCommitment": "NULL",
        "issuedPrivately": "FALSE",
        "blockchainNetId": 246,
        "metadata": {
          "version": "v1.0",
          "buyerReservationId": "95e06592-f52d-4acf-94d8-c5e655ff85c0",
          "isStandardIssuanceRequested": "I-REC",
          "type": "REC",
          "deviceIds": [
            12
          ],
          "groupId": "9"
        }
      },
      {
        "createdAt": "2023-01-23 11:14:36.908494+00",
        "updatedAt": "2023-01-23 11:14:36.908494+00",
        "id": 43,
        "deviceId": 9,
        "generationStartTime": 1650133802,
        "generationEndTime": 1651343399,
        "creationTime": 1674472460,
        "creationBlockHash": "0x08cca3556d708b7459e1c8879a328f88636a8f12f1367d8958e6b4cf23b7fff6",
        "owners": {
          "0x320Bbee0D0CE23302eDDb2707B2DdED3e49E4437": "4672000"
        },
        "claimers": "NULL",
        "claims": "NULL",
        "latestCommitment": "NULL",
        "issuedPrivately": "FALSE",
        "blockchainNetId": 246,
        "metadata": {
          "version": "v1.0",
          "buyerReservationId": "95e06592-f52d-4acf-94d8-c5e655ff85c0",
          "isStandardIssuanceRequested": "I-REC",
          "type": "REC",
          "deviceIds": [
            10
          ],
          "groupId": "9"
        }
      },
      {
        "createdAt": "2023-01-23 11:15:57.930925+00",
        "updatedAt": "2023-01-23 11:15:57.930925+00",
        "id": 44,
        "deviceId": 9,
        "generationStartTime": 1656613801,
        "generationEndTime": 1659292199,
        "creationTime": 1674472545,
        "creationBlockHash": "0x2ac25d796c5a2bac7c7e9f080c08d2429daa8633877b9be670076311f85c8a6c",
        "owners": {
          "0x320Bbee0D0CE23302eDDb2707B2DdED3e49E4437": "7879700"
        },
        "claimers": "NULL",
        "claims": "NULL",
        "latestCommitment": "NULL",
        "issuedPrivately": "FALSE",
        "blockchainNetId": 246,
        "metadata": {
          "version": "v1.0",
          "buyerReservationId": "95e06592-f52d-4acf-94d8-c5e655ff85c0",
          "isStandardIssuanceRequested": "I-REC",
          "type": "REC",
          "deviceIds": [
            10
          ],
          "groupId": "9"
        }
      },
      {
        "createdAt": "2023-01-23 11:17:18.748778+00",
        "updatedAt": "2023-01-23 11:17:18.748778+00",
        "id": 45,
        "deviceId": 9,
        "generationStartTime": 1659292201,
        "generationEndTime": 1661970599,
        "creationTime": 1674472625,
        "creationBlockHash": "0x9a8430225d9301aee6592fc2c87687a646d9ddce367b830ed524c2676970ca0b",
        "owners": {
          "0x320Bbee0D0CE23302eDDb2707B2DdED3e49E4437": "8845500"
        },
        "claimers": "NULL",
        "claims": "NULL",
        "latestCommitment": "NULL",
        "issuedPrivately": "FALSE",
        "blockchainNetId": 246,
        "metadata": {
          "version": "v1.0",
          "buyerReservationId": "95e06592-f52d-4acf-94d8-c5e655ff85c0",
          "isStandardIssuanceRequested": "I-REC",
          "type": "REC",
          "deviceIds": [
            10
          ],
          "groupId": "9"
        }
      },
      {
        "createdAt": "2023-01-23 11:18:38.463565+00",
        "updatedAt": "2023-01-23 11:18:44.064084+00",
        "id": 46,
        "deviceId": 9,
        "generationStartTime": 1661970601,
        "generationEndTime": 1664562599,
        "creationTime": 1674472705,
        "creationBlockHash": "0x0f7aecfcace9ee869aeeedd65c4efbe4c93777f50e9226d3df330d4f43414c91",
        "owners": {
          "0x320Bbee0D0CE23302eDDb2707B2DdED3e49E4437": "10755300"
        },
        "claimers": "NULL",
        "claims": "NULL",
        "latestCommitment": "NULL",
        "issuedPrivately": "FALSE",
        "blockchainNetId": 246,
        "metadata": {
          "version": "v1.0",
          "buyerReservationId": "95e06592-f52d-4acf-94d8-c5e655ff85c0",
          "isStandardIssuanceRequested": "I-REC",
          "type": "REC",
          "deviceIds": [
            10
          ],
          "groupId": "9"
        }
      },
      {
        "createdAt": "2023-01-23 11:20:15.329845+00",
        "updatedAt": "2023-01-23 11:20:15.329845+00",
        "id": 47,
        "deviceId": 9,
        "generationStartTime": 1667241001,
        "generationEndTime": 1669832999,
        "creationTime": 1674472790,
        "creationBlockHash": "0x01ea6cbdbc98186e759c11a1a337528f938001fa3b72fdfa8b68e7b5014ec08e",
        "owners": {
          "0x320Bbee0D0CE23302eDDb2707B2DdED3e49E4437": "9646300"
        },
        "claimers": "NULL",
        "claims": "NULL",
        "latestCommitment": "NULL",
        "issuedPrivately": "FALSE",
        "blockchainNetId": 246,
        "metadata": {
          "version": "v1.0",
          "buyerReservationId": "95e06592-f52d-4acf-94d8-c5e655ff85c0",
          "isStandardIssuanceRequested": "I-REC",
          "type": "REC",
          "deviceIds": [
            10
          ],
          "groupId": "9"
        }
      },
      {
        "createdAt": "2023-02-15 07:47:49.27722+00",
        "updatedAt": "2023-02-15 07:47:49.27722+00",
        "id": 48,
        "deviceId": 9,
        "generationStartTime": 1669833001,
        "generationEndTime": 1671042599,
        "creationTime": 1676358480,
        "creationBlockHash": "0xe02e6139a23bcb22f73b7ca13f65125f973c217fcdecb32ce3c8399751db368d",
        "owners": {
          "0x320Bbee0D0CE23302eDDb2707B2DdED3e49E4437": "3937500"
        },
        "claimers": "NULL",
        "claims": "NULL",
        "latestCommitment": "NULL",
        "issuedPrivately": "FALSE",
        "blockchainNetId": 246,
        "metadata": {
          "version": "v1.0",
          "buyerReservationId": "95e06592-f52d-4acf-94d8-c5e655ff85c0",
          "isStandardIssuanceRequested": "I-REC",
          "type": "REC",
          "deviceIds": [
            10
          ],
          "groupId": "9"
        }
      },
      {
        "createdAt": "2023-02-23 07:29:45.634561+00",
        "updatedAt": "2023-02-23 07:29:45.634561+00",
        "id": 49,
        "deviceId": 9,
        "generationStartTime": 1651343401,
        "generationEndTime": 1654021799,
        "creationTime": 1677063760,
        "creationBlockHash": "0x3ece329d69310a2b0326062a0a051071baef11ab9e1f23a6790b93efa554b14b",
        "owners": {
          "0x320Bbee0D0CE23302eDDb2707B2DdED3e49E4437": "15322600"
        },
        "claimers": "NULL",
        "claims": "NULL",
        "latestCommitment": "NULL",
        "issuedPrivately": "FALSE",
        "blockchainNetId": 246,
        "metadata": {
          "version": "v1.0",
          "buyerReservationId": "95e06592-f52d-4acf-94d8-c5e655ff85c0",
          "isStandardIssuanceRequested": "I-REC",
          "type": "REC",
          "deviceIds": [
            9
          ],
          "groupId": "9"
        }
      },
      {
        "createdAt": "2023-01-23 11:20:49.594445+00",
        "updatedAt": "2023-01-23 11:20:54.428691+00",
        "id": 50,
        "deviceId": 9,
        "generationStartTime": 1654021801,
        "generationEndTime": 1656613799,
        "creationTime": 1674472835,
        "creationBlockHash": "0x3a33eac0ece764c7c2999e7b1990c436dec25a21ece88aac6c58ca06b8e33e00",
        "owners": {
          "0x320Bbee0D0CE23302eDDb2707B2DdED3e49E4437": "11984500"
        },
        "claimers": "NULL",
        "claims": "NULL",
        "latestCommitment": "NULL",
        "issuedPrivately": "FALSE",
        "blockchainNetId": 246,
        "metadata": {
          "version": "v1.0",
          "buyerReservationId": "95e06592-f52d-4acf-94d8-c5e655ff85c0",
          "isStandardIssuanceRequested": "I-REC",
          "type": "REC",
          "deviceIds": [
            9
          ],
          "groupId": "9"
        }
      },
      {
        "createdAt": "2023-01-23 11:22:08.847269+00",
        "updatedAt": "2023-01-23 11:22:08.847269+00",
        "id": 51,
        "deviceId": 9,
        "generationStartTime": 1648751401,
        "generationEndTime": 1651343399,
        "creationTime": 1674472915,
        "creationBlockHash": "0x124d3712a01d7cebac7246c753082f11fc24e5e5b8e0acac51a528340dc58fc5",
        "owners": {
          "0x320Bbee0D0CE23302eDDb2707B2DdED3e49E4437": "14820700"
        },
        "claimers": "NULL",
        "claims": "NULL",
        "latestCommitment": "NULL",
        "issuedPrivately": "FALSE",
        "blockchainNetId": 246,
        "metadata": {
          "version": "v1.0",
          "buyerReservationId": "95e06592-f52d-4acf-94d8-c5e655ff85c0",
          "isStandardIssuanceRequested": "I-REC",
          "type": "REC",
          "deviceIds": [
            9
          ],
          "groupId": "9"
        }
      },
      {
        "createdAt": "2023-01-23 11:23:32.807386+00",
        "updatedAt": "2023-01-23 11:23:32.807386+00",
        "id": 52,
        "deviceId": 9,
        "generationStartTime": 1656613801,
        "generationEndTime": 1659292199,
        "creationTime": 1674472995,
        "creationBlockHash": "0x977cbab7a400bead1d4ce9b70a5077ac3e62a27dd833599bf7d9e8315ec846c9",
        "owners": {
          "0x320Bbee0D0CE23302eDDb2707B2DdED3e49E4437": "8300600"
        },
        "claimers": "NULL",
        "claims": "NULL",
        "latestCommitment": "NULL",
        "issuedPrivately": "FALSE",
        "blockchainNetId": 246,
        "metadata": {
          "version": "v1.0",
          "buyerReservationId": "95e06592-f52d-4acf-94d8-c5e655ff85c0",
          "isStandardIssuanceRequested": "I-REC",
          "type": "REC",
          "deviceIds": [
            9
          ],
          "groupId": "9"
        }
      },
      {
        "createdAt": "2023-01-23 12:19:57.653316+00",
        "updatedAt": "2023-01-23 12:20:35.673645+00",
        "id": 54,
        "deviceId": 9,
        "generationStartTime": 1646073001,
        "generationEndTime": 1648751399,
        "creationTime": 1674476385,
        "creationBlockHash": "0xe136c50cd037d4df4a0ea998b4f2c97e3137517980566d3e1be55cea6d24c27d",
        "owners": {
          "0x320Bbee0D0CE23302eDDb2707B2DdED3e49E4437": "14272300"
        },
        "claimers": "NULL",
        "claims": "NULL",
        "latestCommitment": "NULL",
        "issuedPrivately": "FALSE",
        "blockchainNetId": 246,
        "metadata": {
          "version": "v1.0",
          "buyerReservationId": "95e06592-f52d-4acf-94d8-c5e655ff85c0",
          "isStandardIssuanceRequested": "I-REC",
          "type": "REC",
          "deviceIds": [
            9
          ],
          "groupId": "9"
        }
      },
      {
        "createdAt": "2023-01-23 12:21:19.839847+00",
        "updatedAt": "2023-01-23 12:21:40.266689+00",
        "id": 55,
        "deviceId": 9,
        "generationStartTime": 1664562601,
        "generationEndTime": 1667240999,
        "creationTime": 1674476465,
        "creationBlockHash": "0x6f8c42c753da5d57e4141fb03c94385725dcfa11224e90bfca410e0a4420d841",
        "owners": {
          "0x320Bbee0D0CE23302eDDb2707B2DdED3e49E4437": "11456000"
        },
        "claimers": "NULL",
        "claims": "NULL",
        "latestCommitment": "NULL",
        "issuedPrivately": "FALSE",
        "blockchainNetId": 246,
        "metadata": {
          "version": "v1.0",
          "buyerReservationId": "95e06592-f52d-4acf-94d8-c5e655ff85c0",
          "isStandardIssuanceRequested": "I-REC",
          "type": "REC",
          "deviceIds": [
            9
          ],
          "groupId": "9"
        }
      },
      {
        "createdAt": "2023-01-23 12:22:50.229245+00",
        "updatedAt": "2023-01-23 12:22:50.229245+00",
        "id": 56,
        "deviceId": 9,
        "generationStartTime": 1654021801,
        "generationEndTime": 1656613799,
        "creationTime": 1674476555,
        "creationBlockHash": "0x8dbe78790fb73138596ba46b25be86e50985d2a620e9d3f1aad6cd71e6538ef6",
        "owners": {
          "0x320Bbee0D0CE23302eDDb2707B2DdED3e49E4437": "2675900"
        },
        "claimers": "NULL",
        "claims": "NULL",
        "latestCommitment": "NULL",
        "issuedPrivately": "FALSE",
        "blockchainNetId": 246,
        "metadata": {
          "version": "v1.0",
          "buyerReservationId": "95e06592-f52d-4acf-94d8-c5e655ff85c0",
          "isStandardIssuanceRequested": "I-REC",
          "type": "REC",
          "deviceIds": [
            13
          ],
          "groupId": "9"
        }
      },
      {
        "createdAt": "2023-01-23 12:24:22.522089+00",
        "updatedAt": "2023-01-23 12:24:23.02064+00",
        "id": 57,
        "deviceId": 9,
        "generationStartTime": 1656613801,
        "generationEndTime": 1659292199,
        "creationTime": 1674476645,
        "creationBlockHash": "0xbd0a2d4dee4cf6eaedea1021a6c9c95c91d956d21eebc84a11323275811fd472",
        "owners": {
          "0x320Bbee0D0CE23302eDDb2707B2DdED3e49E4437": "2710100"
        },
        "claimers": "NULL",
        "claims": "NULL",
        "latestCommitment": "NULL",
        "issuedPrivately": "FALSE",
        "blockchainNetId": 246,
        "metadata": {
          "version": "v1.0",
          "buyerReservationId": "95e06592-f52d-4acf-94d8-c5e655ff85c0",
          "isStandardIssuanceRequested": "I-REC",
          "type": "REC",
          "deviceIds": [
            13
          ],
          "groupId": "9"
        }
      },
      {
        "createdAt": "2023-01-23 12:32:47.2108+00",
        "updatedAt": "2023-01-23 12:32:47.2108+00",
        "id": 59,
        "deviceId": 9,
        "generationStartTime": 1659292201,
        "generationEndTime": 1661970599,
        "creationTime": 1674477150,
        "creationBlockHash": "0x2e0dca801a40e02d38f7fcadefcb13b8dd036ddd3b53f10608d81b899c801447",
        "owners": {
          "0x320Bbee0D0CE23302eDDb2707B2DdED3e49E4437": "3078900"
        },
        "claimers": "NULL",
        "claims": "NULL",
        "latestCommitment": "NULL",
        "issuedPrivately": "FALSE",
        "blockchainNetId": 246,
        "metadata": {
          "version": "v1.0",
          "buyerReservationId": "95e06592-f52d-4acf-94d8-c5e655ff85c0",
          "isStandardIssuanceRequested": "I-REC",
          "type": "REC",
          "deviceIds": [
            13
          ],
          "groupId": "9"
        }
      },
      {
        "createdAt": "2023-01-23 12:34:10.208001+00",
        "updatedAt": "2023-01-23 12:34:37.776098+00",
        "id": 60,
        "deviceId": 9,
        "generationStartTime": 1651343401,
        "generationEndTime": 1654021799,
        "creationTime": 1674477235,
        "creationBlockHash": "0xf985d34a9804c4737d86db63ed728d673e0c2a4a8da6690336d088961719df8c",
        "owners": {
          "0x320Bbee0D0CE23302eDDb2707B2DdED3e49E4437": "2777900"
        },
        "claimers": "NULL",
        "claims": "NULL",
        "latestCommitment": "NULL",
        "issuedPrivately": "FALSE",
        "blockchainNetId": 246,
        "metadata": {
          "version": "v1.0",
          "buyerReservationId": "95e06592-f52d-4acf-94d8-c5e655ff85c0",
          "isStandardIssuanceRequested": "I-REC",
          "type": "REC",
          "deviceIds": [
            13
          ],
          "groupId": "9"
        }
      },
      {
        "createdAt": "2023-01-25 12:51:31.709132+00",
        "updatedAt": "2023-01-25 12:51:31.709132+00",
        "id": 86,
        "deviceId": 9,
        "generationStartTime": 1651343401,
        "generationEndTime": 1654021799,
        "creationTime": 1674651065,
        "creationBlockHash": "0xbaad4160b147f83d940d55a8bff8f1e93eb3c6a993f5c5837a9666a7550d1a79",
        "owners": {
          "0x320Bbee0D0CE23302eDDb2707B2DdED3e49E4437": "5611700"
        },
        "claimers": "NULL",
        "claims": "NULL",
        "latestCommitment": "NULL",
        "issuedPrivately": "FALSE",
        "blockchainNetId": 246,
        "metadata": {
          "version": "v1.0",
          "buyerReservationId": "95e06592-f52d-4acf-94d8-c5e655ff85c0",
          "isStandardIssuanceRequested": "I-REC",
          "type": "REC",
          "deviceIds": [
            12
          ],
          "groupId": "9"
        }
      },
      {
        "createdAt": "2023-01-25 12:58:54.019531+00",
        "updatedAt": "2023-01-25 12:58:54.019531+00",
        "id": 87,
        "deviceId": 9,
        "generationStartTime": 1654021801,
        "generationEndTime": 1656613799,
        "creationTime": 1674651505,
        "creationBlockHash": "0xbf169938fca581e031e286dfbe564ded03b0848a6d5837a5a2c2c62ba07259ad",
        "owners": {
          "0x320Bbee0D0CE23302eDDb2707B2DdED3e49E4437": "6526800"
        },
        "claimers": "NULL",
        "claims": "NULL",
        "latestCommitment": "NULL",
        "issuedPrivately": "FALSE",
        "blockchainNetId": 246,
        "metadata": {
          "version": "v1.0",
          "buyerReservationId": "95e06592-f52d-4acf-94d8-c5e655ff85c0",
          "isStandardIssuanceRequested": "I-REC",
          "type": "REC",
          "deviceIds": [
            12
          ],
          "groupId": "9"
        }
      },
      {
        "createdAt": "2023-01-31 07:16:23.53761+00",
        "updatedAt": "2023-01-31 07:16:23.53761+00",
        "id": 99,
        "deviceId": 9,
        "generationStartTime": 1654021801,
        "generationEndTime": 1656613799,
        "creationTime": 1675149340,
        "creationBlockHash": "0x8c1f8d86fe721be68d54aa461c71ef08f1ee4aee00d89ab64fedabfc001dd071",
        "owners": {
          "0x320Bbee0D0CE23302eDDb2707B2DdED3e49E4437": "6526800"
        },
        "claimers": "NULL",
        "claims": "NULL",
        "latestCommitment": "NULL",
        "issuedPrivately": "FALSE",
        "blockchainNetId": 246,
        "metadata": {
          "version": "v1.0",
          "buyerReservationId": "95e06592-f52d-4acf-94d8-c5e655ff85c0",
          "isStandardIssuanceRequested": "I-REC",
          "type": "REC",
          "deviceIds": [
            12
          ],
          "groupId": "9"
        }
      },
      {
        "createdAt": "2023-02-12 05:12:46.474104+00",
        "updatedAt": "2023-02-12 05:12:46.474104+00",
        "id": 167,
        "deviceId": 9,
        "generationStartTime": 1664562601,
        "generationEndTime": 1667240999,
        "creationTime": 1676178740,
        "creationBlockHash": "0x0c62f415f90c054410de4563ae7982223530c53804cf747e620b4934db85a209",
        "owners": {
          "0x320Bbee0D0CE23302eDDb2707B2DdED3e49E4437": "11089500"
        },
        "claimers": "NULL",
        "claims": "NULL",
        "latestCommitment": "NULL",
        "issuedPrivately": "FALSE",
        "blockchainNetId": 246,
        "metadata": {
          "version": "v1.0",
          "buyerReservationId": "95e06592-f52d-4acf-94d8-c5e655ff85c0",
          "isStandardIssuanceRequested": "I-REC",
          "type": "REC",
          "deviceIds": [
            10
          ],
          "groupId": "9"
        }
      },
      {
        "createdAt": "2023-02-12 07:08:21.727622+00",
        "updatedAt": "2023-02-12 07:08:21.727622+00",
        "id": 169,
        "deviceId": 9,
        "generationStartTime": 1659292201,
        "generationEndTime": 1661970599,
        "creationTime": 1676185680,
        "creationBlockHash": "0xbeb17df585c02c79e087b551533a97c463686d23321ca3d50ca28293c496591b",
        "owners": {
          "0x320Bbee0D0CE23302eDDb2707B2DdED3e49E4437": "9716000"
        },
        "claimers": "NULL",
        "claims": "NULL",
        "latestCommitment": "NULL",
        "issuedPrivately": "FALSE",
        "blockchainNetId": 246,
        "metadata": {
          "version": "v1.0",
          "buyerReservationId": "95e06592-f52d-4acf-94d8-c5e655ff85c0",
          "isStandardIssuanceRequested": "I-REC",
          "type": "REC",
          "deviceIds": [
            9
          ],
          "groupId": "9"
        }
      },
      {
        "createdAt": "2023-02-12 07:15:53.517035+00",
        "updatedAt": "2023-02-12 07:15:53.517035+00",
        "id": 175,
        "deviceId": 9,
        "generationStartTime": 1659292201,
        "generationEndTime": 1661970599,
        "creationTime": 1676186130,
        "creationBlockHash": "0x67eda41b7ed37e340826104e3357e642d0ff346d78502a231742b13dfa12f6a0",
        "owners": {
          "0x320Bbee0D0CE23302eDDb2707B2DdED3e49E4437": "9716000"
        },
        "claimers": "NULL",
        "claims": "NULL",
        "latestCommitment": "NULL",
        "issuedPrivately": "FALSE",
        "blockchainNetId": 246,
        "metadata": {
          "version": "v1.0",
          "buyerReservationId": "95e06592-f52d-4acf-94d8-c5e655ff85c0",
          "isStandardIssuanceRequested": "I-REC",
          "type": "REC",
          "deviceIds": [
            9
          ],
          "groupId": "9"
        }
      },
      {
        "createdAt": "2023-02-23 07:29:45.634561+00",
        "updatedAt": "2023-02-23 07:29:45.634561+00",
        "id": 184,
        "deviceId": 9,
        "generationStartTime": 1648751401,
        "generationEndTime": 1651343399,
        "creationTime": 1677063760,
        "creationBlockHash": "0x23ee3782de16d444d13a55973b43ab70bcf12c1c7e6199f850f6a0bc3f2decbb",
        "owners": {
          "0x320Bbee0D0CE23302eDDb2707B2DdED3e49E4437": "1801700"
        },
        "claimers": "NULL",
        "claims": "NULL",
        "latestCommitment": "NULL",
        "issuedPrivately": "FALSE",
        "blockchainNetId": 246,
        "metadata": ":{\"version\":\"v1.0\",\"buyerReservationId\":\"95e06592-f52d-4acf-94d8-c5e655ff85c0\",\"isStandardIssuanceRequested\":\"I-REC\",\"type\":\"REC\",\"deviceIds\":[13],\"groupId\":\"9\"}"
      },
      {
        "createdAt": "2023-02-23 07:29:45.634561+00",
        "updatedAt": "2023-02-23 07:29:45.634561+00",
        "id": 223,
        "deviceId": 9,
        "generationStartTime": 1661970601,
        "generationEndTime": 1664562599,
        "creationTime": 1677063760,
        "creationBlockHash": "0x00bcfecf2b7ef0d1e96bdd345f10105998d6badb29a4e0d7b516879519ff2cc0",
        "owners": {
          "0x320Bbee0D0CE23302eDDb2707B2DdED3e49E4437": "9542000"
        },
        "claimers": "NULL",
        "claims": "NULL",
        "latestCommitment": "NULL",
        "issuedPrivately": "FALSE",
        "blockchainNetId": 246,
        "metadata": {
          "version": "v1.0",
          "buyerReservationId": "95e06592-f52d-4acf-94d8-c5e655ff85c0",
          "isStandardIssuanceRequested": "I-REC",
          "type": "REC",
          "deviceIds": [
            9
          ],
          "groupId": "9"
        }
      },
      {
        "createdAt": "2023-02-12 12:47:11.945192+00",
        "updatedAt": "2023-02-12 12:47:24.909615+00",
        "id": 227,
        "deviceId": 9,
        "generationStartTime": 1646073001,
        "generationEndTime": 1648751399,
        "creationTime": 1676206010,
        "creationBlockHash": "0xa93a71ba585bfad69a4503cd06968cbe8e8e495e0c9d923605013beb51be90c5",
        "owners": {
          "0x320Bbee0D0CE23302eDDb2707B2DdED3e49E4437": "2577200"
        },
        "claimers": "NULL",
        "claims": "NULL",
        "latestCommitment": "NULL",
        "issuedPrivately": "FALSE",
        "blockchainNetId": 246,
        "metadata": {
          "version": "v1.0",
          "buyerReservationId": "95e06592-f52d-4acf-94d8-c5e655ff85c0",
          "isStandardIssuanceRequested": "I-REC",
          "type": "REC",
          "deviceIds": [
            13
          ],
          "groupId": "9"
        }
      },
      {
        "createdAt": "2023-02-12 13:14:48.116158+00",
        "updatedAt": "2023-02-12 13:14:48.116158+00",
        "id": 238,
        "deviceId": 9,
        "generationStartTime": 1661970601,
        "generationEndTime": 1664562599,
        "creationTime": 1676207665,
        "creationBlockHash": "0xbb2251f8d6782dc331250d6393270fc2638804db7340178df1c94f6625fdc288",
        "owners": {
          "0x320Bbee0D0CE23302eDDb2707B2DdED3e49E4437": "3547000"
        },
        "claimers": "NULL",
        "claims": "NULL",
        "latestCommitment": "NULL",
        "issuedPrivately": "FALSE",
        "blockchainNetId": 246,
        "metadata": {
          "version": "v1.0",
          "buyerReservationId": "95e06592-f52d-4acf-94d8-c5e655ff85c0",
          "isStandardIssuanceRequested": "I-REC",
          "type": "REC",
          "deviceIds": [
            13
          ],
          "groupId": "9"
        }
      },
      {
        "createdAt": "2023-02-12 14:06:18.317861+00",
        "updatedAt": "2023-02-12 14:06:18.317861+00",
        "id": 249,
        "deviceId": 9,
        "generationStartTime": 1664562601,
        "generationEndTime": 1667240999,
        "creationTime": 1676210745,
        "creationBlockHash": "0xebb4a9a9c643207b74ce45b992901bfcf2ec0cbcc017de8ab432acf45f14a324",
        "owners": {
          "0x320Bbee0D0CE23302eDDb2707B2DdED3e49E4437": "3521300"
        },
        "claimers": "NULL",
        "claims": "NULL",
        "latestCommitment": "NULL",
        "issuedPrivately": "FALSE",
        "blockchainNetId": 246,
        "metadata": {
          "version": "v1.0",
          "buyerReservationId": "95e06592-f52d-4acf-94d8-c5e655ff85c0",
          "isStandardIssuanceRequested": "I-REC",
          "type": "REC",
          "deviceIds": [
            13
          ],
          "groupId": "9"
        }
      },
      {
        "createdAt": "2023-02-12 14:18:14.878364+00",
        "updatedAt": "2023-02-12 14:18:14.878364+00",
        "id": 250,
        "deviceId": 9,
        "generationStartTime": 1664562601,
        "generationEndTime": 1667240999,
        "creationTime": 1676211475,
        "creationBlockHash": "0x45df265e2d372d4ff9267df5e9fb74e5bf37857fbcea1c4c4192aa67368778a6",
        "owners": {
          "0x320Bbee0D0CE23302eDDb2707B2DdED3e49E4437": "3521300"
        },
        "claimers": "NULL",
        "claims": "NULL",
        "latestCommitment": "NULL",
        "issuedPrivately": "FALSE",
        "blockchainNetId": 246,
        "metadata": {
          "version": "v1.0",
          "buyerReservationId": "95e06592-f52d-4acf-94d8-c5e655ff85c0",
          "isStandardIssuanceRequested": "I-REC",
          "type": "REC",
          "deviceIds": [
            13
          ],
          "groupId": "9"
        }
      }
    ];
    // await this.certificaterrepository.find(
    //   {
    //     where: {
    //       deviceId: groupid,
    //       // claims:IsNull()
    //     }
    //   })
   console.log(certifiedreservation);

    const res = await Promise.all(
      certifiedreservation.map(async (certifiedlist: CertificateWithPerdevicelog) => {
        certifiedlist.certificateStartDate = new Date(certifiedlist.generationStartTime * 1000).toISOString();
        certifiedlist.certificateEndDate = new Date(certifiedlist.generationEndTime * 1000).toISOString();
        certifiedlist.perDeviceCertificateLog = [];

        try {
          JSON.parse(certifiedlist.metadata);
        }
        catch (e) {
          console.error(e, "certificate doesnt contains valid metadta", certifiedlist);
          return;
        }


        const obj = JSON.parse(certifiedlist.metadata);
        console.log("getdate", certifiedlist.generationStartTime, certifiedlist.generationEndTime)
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
        //console.log("changegetdate", devicereadstartdate, devicereadenddate)
        await Promise.all(
          obj.deviceIds.map(async (deviceid: number) => {
            const device = await this.deviceService.findOne(deviceid);
            const devicelog = await this.getCheckCertificateIssueDateLogForDevice(parseInt(groupid), device.externalId, devicereadstartdate, devicereadenddate);
            devicelog.forEach(singleDeviceLogEle => {
              certifiedlist.perDeviceCertificateLog.push(singleDeviceLogEle);
            });
            //console.log(certifiedlist)
            return devicelog;
          })
        );
        //console.log("perDeviceCertificateLog");
        return certifiedlist;
      }),
    );
    //  console.log("res")
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
          certificate_issuance_startdate: s.issuelog_certificate_issuance_startdate,
          certificate_issuance_enddate: s.issuelog_certificate_issuance_enddate,
          readvalue_watthour: s.issuelog_readvalue_watthour,
          status: s.issuelog_status,
          deviceid: s.issuelog_deviceid,
          groupId: s.issuelog_groupId
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
    //console.log(query.getQuery())
    return query;
  }
  async getCertificaterForRedemptionRepot(groupid: string): Promise<Certificate[]> {
    const certifiedreservation = await this.certificaterrepository.find(
      {
        where: {
          deviceId: groupid,
          claims: Not(IsNull())

        }
      })
    console.log("certifiedreservation");
    console.log(certifiedreservation);
    // const res = await Promise.all(
    //   certifiedreservation.map(async (certifiedlist: Certificate) => {
    //     certifiedlist.certificateStartDate = new Date(certifiedlist.generationStartTime * 1000).toISOString();
    //     certifiedlist.certificateEndDate = new Date(certifiedlist.generationEndTime * 1000).toISOString();
    //    certifiedlist.devices = [];

    //     try {
    //       JSON.parse(certifiedlist.metadata);
    //     }
    //     catch (e) {
    //       console.error(e, "certificate doesnt contains valid metadta", certifiedlist);
    //       return;
    //     }
    //     const obj = JSON.parse(certifiedlist.metadata);
    //     console.log("getdate", certifiedlist.generationStartTime, certifiedlist.generationEndTime)


    //     await Promise.all(
    //       obj.deviceIds.map(async (deviceid: number) => {
    //         const device = await this.deviceService.findOne(deviceid);
    //         const devicelog = await this.getCheckCertificateIssueDateLogForDevice(parseInt(groupid), device.externalId, devicereadstartdate, devicereadenddate);
    //         devicelog.forEach(singleDeviceLogEle => {
    //         certifiedlist.devices.push(device);
    //         });
    //         console.log(certifiedlist)
    //         return device;
    //       })
    //     );
    //     //console.log("perDeviceCertificateLog");
    //     return certifiedlist;
    //   }),
    // );
    //  console.log("res")
    //console.log(res);
    return certifiedreservation;
  }
  async getCertificateRedemptionReport(buyerId: number): Promise<any[]> {
    const devicegroups = await this.devicegroupService.getBuyerDeviceGroups(buyerId);
    console.log(devicegroups);
    const myredme = [];
    const res = await Promise.all(
      devicegroups.map(async (devicegroup: DeviceGroupDTO) => {
        console.log(devicegroup.id.toString());

        const cert = await this.getCertificaterForRedemptionRepot(devicegroup.id.toString());
        console.log(cert)
        const res1 = await Promise.all(
          cert.map(async (claimcertificate: Certificate) => {
            console.log("datas")
            console.log(claimcertificate);
            const res2 = await Promise.all(
              claimcertificate.claims.map(async (claims: any) => {
                console.log(claims.claimData)
                myredme.push({
                  compliance: 'I-REC',
                  certificateId: claimcertificate.id,
                  fuelCode: devicegroup?.fuelCode,
                  country: devicegroup?.countryCode,
                  capacityRange: devicegroup?.capacityRange,
                  installations: devicegroup?.installationConfigurations ? devicegroup?.installationConfigurations.join().replace(',', ', ') : '',
                  offTakers: devicegroup?.offTakers.join(),
                  sectors: devicegroup?.sectors ? devicegroup?.sectors.join().replace(',', ', ') : '',
                  commissioningDateRange: devicegroup?.commissioningDateRange
                    .join().replace(',', ', '),
                  standardCompliance: devicegroup?.standardCompliance,

                  redemptionDate: claims.claimData.periodStartDate,
                  certifiedEnergy: claims.value / 10 ** 6,
                  beneficiary: claims.claimData.beneficiary,
                  beneficiary_address: claims.claimData.location,
                  claimCoiuntryCode: claims.claimData.countryCode,
                  purpose: claims.claimData.purpose
                });
              }),
            );
          }),
        );

      }),
    );
    console.log(res);
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

}
