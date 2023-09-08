import {
  Controller,
  Get,
  Post,
  Patch,
  HttpStatus,
  Param,
  Body,
  UseGuards,
  Delete,
  Query,
  ValidationPipe,
  ConflictException
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiResponse,
  ApiOkResponse,
  ApiSecurity,
  ApiTags,
  ApiBody,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { IssuerService } from './issuer.service';
import { ReIssueCertificateDTO } from './dto/re-issue-certificate.dto';
import { PermissionGuard } from 'src/guards';
import { Permission } from '../permission/decorators/permission.decorator';
import { ACLModules } from '../access-control-layer-module-service/decorator/aclModule.decorator';

@ApiTags('Drec Issuer')
@ApiBearerAuth('access-token')
@ApiSecurity('drec')
@Controller('drec-issuer')
export class DrecIssuerController {

  constructor(private readonly issuerService: IssuerService) {

  }

  @Get('/ongoing')
  @UseGuards(PermissionGuard)
  @Permission('Read')
  @ACLModules('DREC_ISSUER_MANAGEMENT_CRUDL')
  @ApiOkResponse({
    description: 'Simple Get For Issuer API',
  })
  async simpleGetCallForOngoing() {

    console.log("got hit from cloudwatch ongoing");


    return new Promise((resolve, reject) => {

      this.invokeIssuerCronOngoing();
      resolve("successfully Hitddd the ongoing API");
    })

  }

  async invokeIssuerCronOngoing() {
    try {
      await this.issuerService.handleCron();
    }
    catch (e) {
      console.error("caught exception in cron ongoing", e);
    }
  }

  @Get('/history')
  @UseGuards(PermissionGuard)
  @Permission('Read')
  @ACLModules('DREC_ISSUER_MANAGEMENT_CRUDL')
  @ApiOkResponse({
    description: 'Simple Get For Issuer API',
  })
  async simpleGetCallForHistory() {

    console.log("got hit from cloudwatch history");


    return new Promise((resolve, reject) => {

      this.invokeIssuerCronForHistory();
      resolve("successfully Hitthe history API");
    })

  }

  @Post()
  @UseGuards(PermissionGuard)
  @Permission('Write')
  @ACLModules('DREC_ISSUER_MANAGEMENT_CRUDL')
  @ApiOkResponse({
    description: 'Re ISSUE certificates for failed data',
    //type:[ReIssueCertificateDTO]
  })
  @ApiBody({ type: ReIssueCertificateDTO })
  async reIssueCertificates(@Body() certificateData) {




    return new Promise((resolve, reject) => {

      //@ts-ignore
      this.issuerService.issueCertificateFromAPI(certificateData);
      resolve("hit the issueance data");
    })

  }

  async invokeIssuerCronForHistory() {
    try {
      await this.issuerService.handleCronForHistoricalIssuance();
    }
    catch (e) {
      console.error("caught exception in cron history", e);
    }
  }



  @Get('/lateongoing')
  @UseGuards(PermissionGuard)
  @Permission('Read')
  @ACLModules('DREC_ISSUER_MANAGEMENT_CRUDL')
  @ApiOkResponse({
    description: 'Simple Get For Issuer API',
  })
  async simpleGetCallForlateOngoing() {

    console.log("got hit from cloudwatch ongoing");


    return new Promise((resolve, reject) => {

      this.invokeIssuerCronlateOngoing();
      resolve("successfully Hitddd the late ongoing API");
    })

  }

  async invokeIssuerCronlateOngoing() {
    try {
      await this.issuerService.handleCronForOngoingLateIssuance();
    }
    catch (e) {
      console.error("caught exception in cron ongoing", e);
    }
  }

}
