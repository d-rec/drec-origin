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
  ApiOperation,
  ApiResponse,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { CountryCodeService } from './countrycode.service';
import { CountryCodeNameDTO, FilterKeyDTO } from './dto';

/*
 * It is Controller of CountrCode with the endpoints of countrycode operations.
 */
@ApiTags('Country List')
@ApiBearerAuth('access-token')
@ApiSecurity('drec')
@Controller('countrycode')
export class CountryCodeController {
  private readonly logger = new Logger(CountryCodeController.name);

  constructor(private readonly countryCodeService: CountryCodeService) {}

  /*
   * It is GET api to get list of all country codes with filteration by pattern(string)
   * @return { Array<CountryCodeNameDTO>} returns array of countrycode
   */
  @Get('/list')
  @ApiOperation({
    summary: 'Fetch all country codes',
    description:
      'Retrieve a list of all country codes, optionally filtered by a specified pattern.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: [CountryCodeNameDTO],
    description: 'Successfully retrieved the list of country codes.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid filter parameters provided.',
  })
  async getCountryCode(
    @Query(ValidationPipe) filterDTO: FilterKeyDTO,
  ): Promise<CountryCodeNameDTO[]> {
    this.logger.verbose(`With in getCountryCode`);
    return this.countryCodeService.getCountryCode(filterDTO);
  }
}
