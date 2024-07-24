import { Controller, Get, Post, Body, Logger } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiSecurity,
  ApiTags,
  ApiBody,
} from '@nestjs/swagger';
import { IssuerService } from './issuer.service';
import { ReIssueCertificateDTO } from './dto/re-issue-certificate.dto';

@ApiTags('Drec Issuer')
@ApiBearerAuth('access-token')
@ApiSecurity('drec')
@Controller('drec-issuer')
export class DrecIssuerController {
  private readonly logger = new Logger(DrecIssuerController.name);

  constructor(private readonly issuerService: IssuerService) {}
  /**
   *
   * @returns
   */
  @Get('/ongoing')
  @ApiOkResponse({
    description: 'Simple Get For Issuer API',
  })
  async simpleGetCallForOngoing() {
    this.logger.verbose(
      `With in simpleGetCallForOngoing`,
      `got hit from cloudwatch ongoing`,
    );

    return new Promise((resolve, reject) => {
      this.invokeIssuerCronOngoing();
      this.logger.log(`successfully Hitddd the ongoing API`);
      resolve('successfully Hitddd the ongoing API');
    });
  }

  async invokeIssuerCronOngoing() {
    this.logger.verbose(`With in invokeIssuerCronOngoing`);
    try {
      await this.issuerService.handleCron();
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
  async simpleGetCallForHistory() {
    this.logger.verbose(
      `With in simpleGetCallForHistory`,
      `got hit from cloudwatch history`,
    );

    return new Promise((resolve, reject) => {
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
  async reIssueCertificates(@Body() certificateData) {
    this.logger.verbose(`With in reIssueCertificates`);

    return new Promise((resolve, reject) => {
      this.issuerService.issueCertificateFromAPI(certificateData);
      this.logger.log(`hit the issueance data`);
      resolve('hit the issueance data');
    });
  }

  async invokeIssuerCronForHistory() {
    this.logger.verbose(`With in invokeIssuerCronForHistory`);
    try {
      await this.issuerService.handleCronForHistoricalIssuance();
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
  async simpleGetCallForlateOngoing() {
    this.logger.verbose(
      `With in simpleGetCallForlateOngoing`,
      `got hit from cloudwatch ongoing`,
    );

    return new Promise((resolve, reject) => {
      this.invokeIssuerCronlateOngoing();
      this.logger.log(`successfully Hitddd the late ongoing API`);
      resolve('successfully Hitddd the late ongoing API');
    });
  }

  async invokeIssuerCronlateOngoing() {
    this.logger.verbose(`With in invokeIssuerCronlateOngoing`);
    try {
      await this.issuerService.handleCronForOngoingLateIssuance();
    } catch (e) {
      this.logger.error('caught exception in cron ongoing', e);
    }
  }
}
