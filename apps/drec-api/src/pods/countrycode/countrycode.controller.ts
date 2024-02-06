import {
    Controller,
    Get,
    HttpStatus,
    ValidationPipe,
    Query,
    Logger,
  } from '@nestjs/common';
  
  import {
    ApiBearerAuth,
    ApiResponse,
    ApiSecurity,
    ApiTags,
  } from '@nestjs/swagger';
import {CountrycodeService}from './countrycode.service';
import {CountryCodeNameDTO ,FilterKeyDTO} from './dto'

/*
* It is Controller of CountrCode with the endpoints of countrycode operations.
*/
@ApiTags('CountryList')
@ApiBearerAuth('access-token')
@ApiSecurity('drec')
@Controller('countrycode')
export class CountrycodeController {
  
  private readonly logger = new Logger(CountrycodeController.name);

    constructor(
private readonly countrycodeService:CountrycodeService
    ){}

    /*
    * It is GET api to get list of all country codes with filteration by pattern(string)
    * @return { Array<CountryCodeNameDTO>} returns array of countrycode 
    */
    @Get('/list')
  @ApiResponse({
    status: HttpStatus.OK,
    type: [CountryCodeNameDTO],
    description: 'Returns all  Country code List',
  })
  async getCountryCode(
    @Query(ValidationPipe) filterDto: FilterKeyDTO
  ):Promise< CountryCodeNameDTO[] >{
    this.logger.verbose(`With in getCountryCode`);
    return this.countrycodeService.getCountryCode(filterDto);
     
  }

}
