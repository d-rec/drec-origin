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
import { PermissionGuard } from 'src/guards';
import { Permission } from '../permission/decorators/permission.decorator';
import { ACLModules } from '../access-control-layer-module-service/decorator/aclModule.decorator';
@ApiTags('SdgBenefit')
@ApiBearerAuth('access-token')
@ApiSecurity('drec')
@Controller('sdgbenefit')
export class SdgbenefitController {
    constructor(private readonly SdgbenefitService: SdgbenefitService) {}

   
  @Post()
 @UseGuards(PermissionGuard)
 @Permission('Write')
 @ACLModules('SDGBENEFIT_MANAGEMENT_CRUDL')
 create(@Body() createsdgbenefitDto: SdgBenefitDTO) {
   return this.SdgbenefitService.create(createsdgbenefitDto);
 }

 @Get()
@UseGuards(PermissionGuard)
@Permission('Read')
@ACLModules('SDGBENEFIT_MANAGEMENT_CRUDL')
 findAll() {
   return this.SdgbenefitService.findAll();
 }
 @Get('/code')
 @UseGuards(PermissionGuard)
 @Permission('Read')
 @ACLModules('SDGBENEFIT_MANAGEMENT_CRUDL')
 @ApiResponse({
   status: HttpStatus.OK,
   type: [SDGBCodeNameDTO],
   description: 'Returns all IREC fuel types',
 })
 getFuelTypes(): SDGBCodeNameDTO[] {
   const sdgbcode = this.SdgbenefitService.getSDGBCode();
   return sdgbcode.map((fuelType) => plainToClass(SDGBCodeNameDTO, fuelType));
 }
}
