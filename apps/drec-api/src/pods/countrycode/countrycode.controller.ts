
import {
    Controller,
    Get,
    Post,
    Patch,
    HttpStatus,
    Param,
    Body,
    UseGuards,
    ValidationPipe,
    Query,
    ConflictException,
  } from '@nestjs/common';
  
  import {
    ApiBearerAuth,
    ApiNotFoundResponse,
    ApiResponse,
    ApiOkResponse,
    ApiSecurity,
    ApiTags,
  } from '@nestjs/swagger';
  import { AuthGuard } from '@nestjs/passport';
  import { plainToClass } from 'class-transformer';
import {CountrycodeService}from './countrycode.service';
import {CountryCodeNameDTO ,FilterKeyDTO} from './dto'
@ApiTags('CountryList')
@ApiBearerAuth('access-token')
@ApiSecurity('drec')
@Controller('countrycode')
export class CountrycodeController {
    constructor(
private readonly countrycodeService:CountrycodeService
    ){}

    @Get('/list')
  @ApiResponse({
    status: HttpStatus.OK,
    type: [CountryCodeNameDTO],
    description: 'Returns all  Country code List',
  })
  async getCountryCode(
    @Query(ValidationPipe) filterDto: FilterKeyDTO
  ):Promise< CountryCodeNameDTO[] >{
    
    return this.countrycodeService.getCountryCode(filterDto);
     
  }

}
