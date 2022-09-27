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
import {SdgBenefitDTO} from './dto/add_sdgbenefit.dto'
  import {SdgbenefitService} from './sdgbenefit.service'
@ApiTags('SdgBenefit')
@ApiBearerAuth('access-token')
@ApiSecurity('drec')
@Controller('sdgbenefit')
export class SdgbenefitController {
    constructor(private readonly SdgbenefitService: SdgbenefitService) {}

   
  @Post()
 
 create(@Body() createsdgbenefitDto: SdgBenefitDTO) {
   return this.SdgbenefitService.create(createsdgbenefitDto);
 }

 @Get()

 findAll() {
   return this.SdgbenefitService.findAll();
 }

}
