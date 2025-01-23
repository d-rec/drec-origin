import {
  Controller,
  Get,
  HttpStatus,
  Param,
  UseGuards,
  ValidationPipe,
  Query,
  ConflictException,
  BadRequestException,
  Logger,
  Res,
  ParseUUIDPipe,
} from '@nestjs/common';

import {
  ApiBearerAuth,
  ApiResponse,
  ApiOkResponse,
  ApiSecurity,
  ApiTags,
  ApiQuery,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { CheckCertificateIssueDateLogForDeviceEntity } from '../device/check_certificate_issue_date_log_for_device.entity';
import { CertificateLogService } from './certificate-log.service';
import {
  AmountFormattingDTO,
  FilterDTO,
  GroupIDBasedFilteringDTO,
} from './dto/filter.dto';
import { UserDecorator } from '../user/decorators/user.decorator';
import { ILoggedInUser } from '../../models';
import { DeviceGroupService } from '../device-group/device-group.service';
import { CertificateNewWithPerDeviceLog, CertificateLogResponse } from './dto';
import { PowerFormatter } from '../../utils/PowerFormatter';
import { ActiveUserGuard } from '../../guards/ActiveUserGuard';
import { PermissionGuard } from '../../guards/PermissionGuard';
import { Permission } from '../permission/decorators/permission.decorator';
import { ACLModules } from '../access-control-layer-module-service/decorator/aclModule.decorator';
import { DeviceFilterDTO } from './dto/deviceFilter.dto';
import { Role } from '../../utils/enums';
import { OrganizationService } from '../organization/organization.service';
import { UserService } from '../user/user.service';
import { Response } from 'express';

/*
 * It is Controller of ACL Module with the endpoints of ACL module operations.
 */
@ApiTags('certificate-log')
@ApiBearerAuth('access-token')
@ApiSecurity('drec')
@Controller('/certificate-log')
export class CertificateLogController {
  private readonly logger = new Logger(CertificateLogController.name);

  constructor(
    private readonly certificateLogService: CertificateLogService,
    private readonly deviceGroupService: DeviceGroupService,
    private readonly organizationService: OrganizationService,
    private readonly userService: UserService,
  ) {}

  /*
   * It is GET api to list all certificate issues date log of devices.
   * @return { Array<CheckCertificateIssueDateLogForDeviceEntity> } returns all issue logs of device
   */
  @Get()
  @UseGuards(AuthGuard('jwt'), PermissionGuard)
  @Permission('Read')
  @ACLModules('CERTIFICATE_LOG_MANAGEMENT_CRUDL')
  @ApiOkResponse({
    type: [CheckCertificateIssueDateLogForDeviceEntity],
    description: 'Returns all individual devices certificate log',
  })
  async getAll(): Promise<CheckCertificateIssueDateLogForDeviceEntity[]> {
    this.logger.verbose(`With in getAll`);
    return this.certificateLogService.find();
  }

  /*
   * Need to ask Namrata
   */
  @Get('/claim-amount-in-ethers-json')
  @UseGuards(PermissionGuard)
  @Permission('Read')
  @ACLModules('CERTIFICATE_LOG_MANAGEMENT_CRUDL')
  async getClaimAmountInEthersJSON(
    @Query() amountFormatData: AmountFormattingDTO,
  ): Promise<string> {
    this.logger.verbose(`with in getClaimAmountInEthersJSON`);
    return PowerFormatter.getBaseValueFromValueInDisplayUnitInEthers(
      amountFormatData.amount,
    );
  }

  /*
   * It is GET api to list the  cerficate log of devices filtered by groupId
   * @return { Array<CheckCertificateIssueDateLogForDeviceEntity> } returns the logs of certicates
   */
  @Get('/by-reservation-groupId')
  @UseGuards(AuthGuard('jwt'), PermissionGuard)
  @Permission('Read')
  @ACLModules('CERTIFICATE_LOG_MANAGEMENT_CRUDL')
  @ApiOkResponse({
    type: [CheckCertificateIssueDateLogForDeviceEntity],
    description:
      'Returns Certificate logs For individual devices based on groupId',
  })
  async getByGroupId(
    @Query(ValidationPipe) filterDTO: GroupIDBasedFilteringDTO,
  ): Promise<CheckCertificateIssueDateLogForDeviceEntity[]> {
    this.logger.verbose(`With in getByGroupId`);
    return this.certificateLogService.findByGroupId(filterDTO.groupId);
  }

  /**
   * It is GET api to list issuer certificates of groupId
   * @return { Array<CertificateNewWithPerDeviceLog> } returns issuer certicates of groupId
   * @param groupId
   * @param user
   */
  @Get('/issuer/certified/:groupUid')
  @UseGuards(AuthGuard('jwt'), PermissionGuard)
  @Permission('Read')
  @ACLModules('CERTIFICATE_LOG_MANAGEMENT_CRUDL')
  @ApiOkResponse({
    type: [CertificateNewWithPerDeviceLog],
    description: 'Returns issuer Certificate of groupId',
  })
  async getIssuerCertificate(
    @Param('groupUid', ParseUUIDPipe) groupId: string,
    @UserDecorator() user: ILoggedInUser,
  ): Promise<CertificateNewWithPerDeviceLog[]> {
    this.logger.verbose(`With in getissueCertificate`);
    const deviceGroup = await this.deviceGroupService.findOne({
      devicegroup_uid: groupId,
    });

    if (deviceGroup === null || deviceGroup.buyerId != user.id) {
      this.logger.error(
        `Group UId is not of this buyer, invalid value was sent`,
      );
      throw new ConflictException({
        success: false,
        message: 'Group UId is not of this buyer, invalid value was sent',
      });
    }
    return await this.certificateLogService.getCertificateFromOldOrNew(
      deviceGroup.id.toString(),
    );
  }

  /*
   * It is GET api to list issuer certificates of groupId
   * @return { Array<CertificateNewWithPerDeviceLog> } returns issuer certicates of groupId
   * @param { groupid } Need to ask Namrata
   */
  @Get('/issuer/certified/new/:groupUid')
  @UseGuards(AuthGuard(['jwt', 'oauth2-client-password']), PermissionGuard)
  @Permission('Read')
  @ACLModules('CERTIFICATE_LOG_MANAGEMENT_CRUDL')
  @ApiOkResponse({
    type: [CertificateNewWithPerDeviceLog],
    description: 'Returns issuer Certificate of groupId',
  })
  async getCertificatesFromUpdatedCertificateTables(
    @Param('groupUid', ParseUUIDPipe) groupId: string,
    @Query('pageNumber') pageNumber: number,
    @UserDecorator() user: ILoggedInUser,
  ): Promise<CertificateNewWithPerDeviceLog[]> {
    this.logger.verbose('With in getCertificatesFromUpdatedCertificateTables');

    const deviceGroup = await this.deviceGroupService.findOne({
      devicegroup_uid: groupId,
    });

    if (user.role === Role.ApiUser) {
      if (deviceGroup.api_user_id != user.api_user_id) {
        this.logger.error(`Group UId  does not  belongs to this apiuser`);
        throw new BadRequestException({
          success: false,
          message: 'Group UId  does not  belongs to this apiuser',
        });
      }
      return this.certificateLogService.getCertificateFromOldOrNew(
        deviceGroup.id.toString(),
        pageNumber,
      );
    }

    if (deviceGroup === null || deviceGroup.buyerId != user.id) {
      this.logger.error(
        `Group UId is not of this buyer, invalid value was sent`,
      );
      throw new ConflictException({
        success: false,
        message: 'Group UId is not of this buyer, invalid value was sent',
      });
    }

    return this.certificateLogService.getCertificateFromOldOrNew(
      deviceGroup.id.toString(),
      pageNumber,
    );
  }

  /**
   * This is GET api used in previous version of DREC, after claiming certicate user can view the redemption report
   */
  @Get('/redemption-report')
  @UseGuards(AuthGuard('jwt'), PermissionGuard)
  @Permission('Read')
  @ACLModules('CERTIFICATE_LOG_MANAGEMENT_CRUDL')
  @ApiOkResponse({
    status: HttpStatus.OK,
    description: 'Returns a new created Device id',
  })
  async getRedemptionReport(
    @UserDecorator() { id }: ILoggedInUser,
  ): Promise<any[]> {
    this.logger.verbose(`With in getRedemptionReport`);
    return this.certificateLogService.getCertificateRedemptionReport(id);
  }

  // @Get('/missingCertificate')
  // findAll() {
  //     return this.certificateLogService.getmissingtoken();
  // }

  /*
   * It is GET api to list all the readings of organization witn pagination and filered by device
   */
  @Get('/certificateReadModule')
  @UseGuards(AuthGuard('jwt'), ActiveUserGuard, PermissionGuard)
  @Permission('Read')
  @ACLModules('CERTIFICATE_LOG_MANAGEMENT_CRUDL')
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns the certificate_read_module table',
  })
  @ApiQuery({
    name: 'certificateStartDate',
    required: false,
  })
  @ApiQuery({
    name: 'certiifcateEndDate',
    required: false,
  })
  @ApiQuery({
    name: 'pageNumber',
    type: Number,
    required: true,
  })
  @ApiQuery({
    name: 'targetVolumeCertificateGenerationRequestedInMegaWattHour',
    type: Number,
    required: false,
  })
  @ApiQuery({
    name: 'deviceFilter',
    type: Object,
    required: false,
  })
  async getCertificateReadModule(
    @UserDecorator() { organizationId }: ILoggedInUser,
    @Query('pageNumber') pageNumber: number,
    @Query('certificateStartDate') generationStartTime?: string,
    @Query('certiifcateEndDate') generationEndTime?: string,
    @Query('targetVolumeCertificateGenerationRequestedInMegaWattHour')
    targetVolumeCertificateGenerationRequestedInMegaWattHour?: number,
    @Query('deviceFilter') deviceFilter?: DeviceFilterDTO,
  ): Promise<{
    result: any[];
    pageNumber: number;
    totalPages: number;
    totalCount: any;
  }> {
    this.logger.verbose(`With in GetCertificateReadModule`);
    return await this.certificateLogService.getsCertificateReadModule(
      organizationId.toString(),
      pageNumber,
      deviceFilter,
      generationStartTime,
      generationEndTime,
      targetVolumeCertificateGenerationRequestedInMegaWattHour,
    );
  }

  @Get('/issuer/certifiedlogOfdevices')
  @UseGuards(AuthGuard(['jwt', 'oauth2-client-password']), PermissionGuard)
  @Permission('Read')
  @ACLModules('CERTIFICATE_LOG_MANAGEMENT_CRUDL')
  @ApiQuery({
    name: 'organizationId',
    type: Number,
    required: false,
    description: 'This query parameter is for apiuser',
  })
  @ApiOkResponse({
    type: [CertificateLogResponse],
    description: 'Returns issuer Certificate of Reservation',
  })
  async getCertificatesForDeveloper(
    @UserDecorator() user: ILoggedInUser,
    @Query(ValidationPipe) filterDTO: FilterDTO,
    @Query('pageNumber') pageNumber: number,
    @Query(
      'organizationId',
      new ValidationPipe({ skipMissingProperties: true }),
    )
    organizationId: number,
  ): Promise<CertificateLogResponse> {
    this.logger.verbose(`With in getCertificatesForDeveloper`);

    if (user.role === Role.ApiUser) {
      // If the user is an ApiUser, organizationId is optional

      if (organizationId) {
        const organization =
          await this.organizationService.findOne(organizationId);
        const orgUser = await this.userService.findByEmail(
          organization.orgEmail,
        );

        if (organization.api_user_id != user.api_user_id) {
          this.logger.error(`Organization requested belongs to other apiuser`);
          throw new BadRequestException({
            success: false,
            message: 'Organization requested belongs to other apiuser',
          });
        } else {
          user.organizationId = organizationId;
          user.role = orgUser.role;
        }
      }
    } else {
      // If the user is not an ApiUser, organizationId is optional
      if (organizationId && organizationId != user.organizationId) {
        this.logger.verbose(
          `Organization requested belongs to other organization`,
        );
        throw new BadRequestException({
          success: false,
          message: 'Organization requested belongs to other organization',
        });
      }
    }

    const result = await this.certificateLogService.getCertifiedLogOfDevices(
      user,
      filterDTO,
      pageNumber,
    );
    if (filterDTO.deviceId) {
      result.certificatelog = (
        result.certificatelog as CertificateNewWithPerDeviceLog[]
      ).filter((log) =>
        log.perDeviceCertificateLog.some(
          (deviceLog) => deviceLog.externalId === filterDTO.deviceId,
        ),
      );
    }

    return result;
  }

  /**
   *
   * @param groupId reservat group uuid
   * @param user user login details
   * @returns
   */
  @Get('/expoert_perdevice/:groupUid')
  @UseGuards(AuthGuard('jwt'), PermissionGuard)
  @Permission('Read')
  @ACLModules('CERTIFICATE_LOG_MANAGEMENT_CRUDL')
  //@ApiOkResponse({ type: [Response], description: 'Returns Certificate logs For individual devices based on groupId' })
  async getCertifcateLogPerDevice(
    @UserDecorator() user: ILoggedInUser,
    @Param('groupUid', ParseUUIDPipe) groupId: string,
    @Res() res: Response,
  ): Promise<void> {
    this.logger.verbose(`With in getByGroupId`);
    this.logger.verbose('With in getCertificatesFromUpdatedCertificateTables');
    const deviceGroup = await this.deviceGroupService.findOne({
      devicegroup_uid: groupId,
    });
    if (user.role === Role.ApiUser) {
      if (deviceGroup.api_user_id != user.api_user_id) {
        this.logger.error(`Group UId  does not  belongs to this apiuser`);
        throw new BadRequestException({
          success: false,
          message: 'Group UId  does not  belongs to this apiuser',
        });
      }
      user.organizationId = deviceGroup.organizationId;
    }
    return this.certificateLogService.createCSV(
      res,
      deviceGroup.id,
      user.organizationId,
      deviceGroup.name,
    );
  }
}
