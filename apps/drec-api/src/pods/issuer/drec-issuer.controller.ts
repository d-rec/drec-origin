import {
  Controller,
  Get,
  Post,
  Body,
  Logger,
  Query,
  HttpStatus,
  HttpException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiSecurity,
  ApiTags,
  ApiBody,
  ApiQuery,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { CertificateService } from './services/certificate.service';
import { ReIssueCertificateDTO } from './dto/re-issue-certificate.dto';
import { HistoricalIssuanceService } from './services/historical-issuance.service';
import { LateOngoingIssuanceService } from './services/late-ongoing-issuance.service';
import { OngoingIssuanceService } from './services/ongoing-issuance.service';
import { DeviceService } from '../device/device.service';
import { CreateIssuerDTO } from './dto/create-issuer.dto';
import { IssuerService } from './services/issuer.service';
import { AuthVerifiedGuard } from '../../guards/AuthVerifiedGuard';

@ApiTags('Issuer')
@ApiBearerAuth('access-token')
@ApiSecurity('drec')
@Controller('drec-issuer')
export class DRECIssuerController {
  private readonly logger = new Logger(DRECIssuerController.name);

  constructor(
    private readonly certificateService: CertificateService,
    private readonly lateOngoingIssuanceService: LateOngoingIssuanceService,
    private readonly historicalIssuanceService: HistoricalIssuanceService,
    private readonly ongoingIssuanceService: OngoingIssuanceService,
    private readonly issuerService: IssuerService,
  ) {}
  /**
   *
   * @returns
   */
  @Get('/ongoing')
  @ApiOperation({
    summary: 'Trigger ongoing issuance process',
    description:
      'This endpoint triggers the ongoing issuance process for certificates.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully triggered the ongoing issuance process.',
  })
  async simpleGetCallForOngoing(): Promise<any> {
    this.logger.verbose(
      `With in simpleGetCallForOngoing`,
      `got hit from cloudwatch ongoing`,
    );

    return new Promise((resolve) => {
      this.invokeIssuerCronOngoing();
      this.logger.log(`successfully Hitddd the ongoing API`);
      resolve('successfully Hitddd the ongoing API');
    });
  }

  async invokeIssuerCronOngoing(): Promise<void> {
    this.logger.verbose(`With in invokeIssuerCronOngoing`);
    try {
      await this.ongoingIssuanceService.scheduleIssuance();
    } catch (e) {
      this.logger.error('caught exception in cron ongoing', e);
    }
  }
  /**
   *
   * @returns
   */
  @Get('/history')
  @ApiOperation({
    summary: 'Trigger historical issuance process',
    description:
      'This endpoint triggers the historical issuance process for certificates.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully triggered the historical issuance process.',
  })
  async simpleGetCallForHistory(): Promise<any> {
    this.logger.verbose(
      `With in simpleGetCallForHistory`,
      `got hit from cloudwatch history`,
    );

    return new Promise((resolve) => {
      this.invokeIssuerCronForHistory();
      this.logger.log(`successfully Hit the history API`);
      resolve('successfully Hit the history API');
    });
  }
  /**
   *
   * @param certificateData
   * @returns
   */
  @Post()
  @ApiOperation({
    summary: 'Re-issue certificates',
    description:
      'This endpoint re-issues certificates for failed or incomplete issuance tasks. It accepts a request body containing the necessary data to re-issue the certificates.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'The certificates were successfully re-issued. The system has processed the request and updated the certificate records.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description:
      'The request body is invalid or missing required fields. Please check the request body and try again.',
  })
  @ApiBody({ type: ReIssueCertificateDTO })
  async reIssueCertificates(
    @Body() certificateData: ReIssueCertificateDTO,
  ): Promise<any> {
    this.logger.verbose(`With in reIssueCertificates`);

    return new Promise((resolve) => {
      this.certificateService.issueFromAPI(certificateData);
      this.logger.log(`hit the issueance data`);
      resolve('hit the issueance data');
    });
  }

  async invokeIssuerCronForHistory(): Promise<void> {
    this.logger.verbose(`With in invokeIssuerCronForHistory`);
    try {
      await this.historicalIssuanceService.scheduleIssuance();
    } catch (e) {
      this.logger.error('caught exception in cron history', e);
    }
  }

  /**
   *
   * @returns
   */

  @Get('/lateongoing')
  @ApiOperation({
    summary: 'Trigger late ongoing issuance process',
    description:
      'This endpoint triggers the late ongoing issuance process for certificates. It is used to handle delayed issuance tasks that were not processed in the regular cycle.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'The late ongoing issuance process was successfully triggered. The system will now process any delayed certificate issuance tasks.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description:
      'The request is invalid or the provided groupId is invalid. Please check the request and try again.',
  })
  @ApiQuery({ name: 'groupId', type: Number, required: false })
  async simpleGetCallForLateOngoing(
    @Query('groupId') groupId?: number,
  ): Promise<any> {
    this.logger.verbose(
      `With in simpleGetCallForLateOngoing`,
      `got hit from cloudwatch ongoing`,
    );
    this.logger.debug(`Received group id`, groupId);
    this.invokeIssuerCronLateOngoing(groupId);
    this.logger.log(
      `successfully Hit the late ongoing API`,
      'with group id',
      groupId,
    );

    return 'successfully Hit the late ongoing API';
  }

  async invokeIssuerCronLateOngoing(groupId?: number): Promise<void> {
    this.logger.verbose(`With in invokeIssuerCronLateOngoing`);
    try {
      await this.lateOngoingIssuanceService.triggerIssuance(groupId);
    } catch (e) {
      this.logger.error('caught exception in cron ongoing', e);
    }
  }
  /**
   *
   * @returns
   */

  @Post('/missinglateongoing/onetimerun')
  @ApiOperation({
    summary: 'Trigger missing late ongoing issuance process',
    description:
      'This endpoint triggers the missing late ongoing issuance process for certificates.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'The missing late ongoing issuance process was successfully triggered. The system will now process any missed certificate issuance tasks.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description:
      'The request is invalid or missing required parameters. Please check the request and try again.',
  })
  async simpleGetCallForMissingLateOngoing(
    @Query('groupId') groupId?: number,
  ): Promise<any> {
    this.logger.verbose(
      `With in simpleGetCallForLateOngoing`,
      `got hit from cloudwatch ongoing`,
    );

    return new Promise((resolve) => {
      this.invokeIssuerCronMissingLateOngoing(groupId);
      this.logger.log(`successfully Hitddd the late ongoing API`);
      resolve('successfully Hitddd  and added the missed late ongoing cycle');
    });
  }

  async invokeIssuerCronMissingLateOngoing(
    groupId?: number | string,
  ): Promise<void> {
    this.logger.verbose(`With in invokeIssuerCronLateOngoing`);
    try {
      await this.lateOngoingIssuanceService.queueCreateMissingCycles(groupId);
    } catch (e) {
      this.logger.error('caught exception in getting missing cycles', e);
    }
  }

  @Post('/remove-invalid-cycles')
  @ApiOperation({
    summary: 'Archive inactive late ongoing certificate cycles',
    description:
      'This endpoint triggers the process to archive all inactive late ongoing certificate cycles in the system.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'The archive process for inactive late ongoing certificate cycles was successfully triggered.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description:
      'The request is invalid or missing required parameters. Please check the request and try again.',
  })
  async removeInactiveCycles(): Promise<any> {
    this.logger.verbose(
      `With in simpleGetCallForLateOngoing`,
      `got hit from cloudwatch ongoing`,
    );

    return new Promise((resolve) => {
      this.lateOngoingIssuanceService.removeInactiveCycles();
      this.logger.log(`successfully removed the inactive cycles`);
      resolve('successfully removed the inactive cycles');
    });
  }

  @Post('/register')
  @UseGuards(
    AuthVerifiedGuard(['jwt', 'oauth2-client-password'])
  )
  @ApiBody({ type: CreateIssuerDTO })
  async registerIssuer(@Body() createIssuerDto: CreateIssuerDTO): Promise<any> {
    this.logger.verbose(`With in registerIssuer`);
    return await this.issuerService.registerIssuer(createIssuerDto);
  }
}
