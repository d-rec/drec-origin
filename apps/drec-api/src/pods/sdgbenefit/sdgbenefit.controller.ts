import { Controller,Post,Get,
    Body,
    Put,
    Param,
    Patch,
    ParseIntPipe,
    HttpStatus,
    UseGuards,
    UseInterceptors,
    Delete } from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiResponse,
    ApiBody,
    ApiTags,
    ApiUnprocessableEntityResponse,
    ApiParam,
    ApiSecurity,
    ApiOkResponse
  } from '@nestjs/swagger';
  import {SdgBenefitDTO,SDGBCodeNameDTO} from './dto/add_sdgbenefit.dto'
  import {SdgbenefitService} from './sdgbenefit.service';
  import { plainToClass } from 'class-transformer';
@ApiTags('SdgBenefit')
@ApiBearerAuth('access-token')
@ApiSecurity('drec')
@Controller('sdgbenefit')
export class SdgbenefitController {
    constructor(private readonly SdgbenefitService: SdgbenefitService) {}

/**
 * this Api rout use for add sdg Benifites name and code
 * @param createsdgbenefitDto 
 * @returns 
 */
  @Post()
 create(@Body() createsdgbenefitDto: SdgBenefitDTO) {
   return this.SdgbenefitService.create(createsdgbenefitDto);
 }

 /**
  * 
  * @returns 
  */
 @Get()
 @ApiResponse({
  status: HttpStatus.OK,
  type: [SDGBCodeNameDTO],
  description: 'Returns all SDGBenefites',
})
 findAll() {
   return this.SdgbenefitService.findAll();
 }

/**
 * this api rout use for get all sdg benefit from class not any tbale
 * @returns {SDGBCodeNameDTO}
 */
 @Get('/code')
 @ApiResponse({
   status: HttpStatus.OK,
   type: [SDGBCodeNameDTO],
   description: 'Returns all SDGBenefites',
 })
 getFuelTypes(): SDGBCodeNameDTO[] {
   const sdgbcode = this.SdgbenefitService.getSDGBCode();
   return sdgbcode.map((sdgb) => plainToClass(SDGBCodeNameDTO, sdgb));
 }
}
