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

@ApiTags('Drec Issuer')
@ApiBearerAuth('access-token')
@ApiSecurity('drec')
@Controller('drec-issuer')
export class DrecIssuerController {

    constructor(private readonly issuerService: IssuerService)
    {

    }

@Get('/ongoing')
  @ApiOkResponse({
    description: 'Simple Get For Issuer API',
  })
  async simpleGetCallForOngoing(){
  

    return new Promise((resolve, reject) => {

        this.invokeIssuerCronOngoing();
        resolve("successfully Hitddd the ongoing API");   
    })

  }

  async invokeIssuerCronOngoing()
  {
    try
    {
        await this.issuerService.handleCron();
    }
    catch(e)
    {
        console.error("caught exception in cron ongoing", e);
    }
  }

  @Get('/history')
  @ApiOkResponse({
    description: 'Simple Get For Issuer API',
  })
  async simpleGetCallForHistory(){
  

    return new Promise((resolve, reject) => {

        this.invokeIssuerCronForHistory();
        resolve("successfully Hitthe history API");   
    })

  }

  async invokeIssuerCronForHistory()
  {
    try
    {
        await this.issuerService.handleCronForHistoricalIssuance();
    }
    catch(e)
    {
        console.error("caught exception in cron history",e);
    }
  }
}
