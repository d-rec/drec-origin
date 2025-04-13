import { Body, Controller, Get, Logger, Post, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiQuery,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { CertificateService } from './certificate.service';
import { ReIssueCertificateDTO } from './dto/re-issue-certificate.dto';
import { HistoricalIssuanceService } from './historical-issuance.service';
import { LateOngoingIssuanceService } from './late-ongoing-issuance.service';
import { OngoingIssuanceService } from './ongoing-issuance.service';

@ApiTags('DREC Issuer')
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
  ) {}
  /**
   *
   * @returns
   */
  @Get('/ongoing')
  @ApiOkResponse({
    description: 'Simple Get For Issuer API',
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
      await this.ongoingIssuanceService.processIssuance();
    } catch (e) {
      this.logger.error('caught exception in cron ongoing', e);
    }
  }
  /**
   *
   * @returns
   */
  @Get('/history')
  @ApiOkResponse({
    description: 'Simple Get For Issuer API',
  })
  async simpleGetCallForHistory(): Promise<any> {
    this.logger.verbose(
      `With in simpleGetCallForHistory`,
      `got hit from cloudwatch history`,
    );

    return new Promise((resolve) => {
      this.invokeIssuerCronForHistory();
      this.logger.log(`successfully Hitthe history API`);
      resolve('successfully Hitthe history API');
    });
  }
  /**
   *
   * @param certificateData
   * @returns
   */
  @Post()
  @ApiOkResponse({
    description: 'Re ISSUE certificates for failed data',
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
      await this.historicalIssuanceService.processIssuance();
    } catch (e) {
      this.logger.error('caught exception in cron history', e);
    }
  }

  /**
   *
   * @returns
   */

  @Get('/lateongoing')
  @ApiOkResponse({
    description: 'Simple Get For Issuer API',
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
  @ApiOkResponse({
    description: 'Simple add For missing lateongoing',
  })
  async simpleGetCallForMissingLateOngoing(): Promise<any> {
    this.logger.verbose(
      `With in simpleGetCallForLateOngoing`,
      `got hit from cloudwatch ongoing`,
    );

    return new Promise((resolve) => {
      this.invokeIssuerCronMissingLateOngoing();
      this.logger.log(`successfully Hitddd the late ongoing API`);
      resolve('successfully Hitddd  and added the missed late ongoing cycle');
    });
  }

  async invokeIssuerCronMissingLateOngoing(): Promise<void> {
    this.logger.verbose(`With in invokeIssuerCronLateOngoing`);
    try {
      await this.lateOngoingIssuanceService.getMissingCycle();
    } catch (e) {
      this.logger.error('caught exception in getting missing cycles', e);
    }
  }
}
