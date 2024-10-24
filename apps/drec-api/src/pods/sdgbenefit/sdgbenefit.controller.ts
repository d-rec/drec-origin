import {
  Controller,
  Post,
  Get,
  Body,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiResponse,
  ApiTags,
  ApiSecurity,
} from '@nestjs/swagger';
import { SdgBenefitDTO, SDGBCodeNameDTO } from './dto/add_sdgbenefit.dto';
import { SdgbenefitService } from './sdgbenefit.service'; // eslint-disable-line @typescript-eslint/no-unused-vars
import { plainToClass } from 'class-transformer';
import { SdgBenefit } from './sdgbenefit.entity';
@ApiTags('SdgBenefit')
@ApiBearerAuth('access-token')
@ApiSecurity('drec')
@Controller('sdgbenefit')
export class SdgbenefitController {
  private readonly logger = new Logger(SdgbenefitController.name);

  constructor(private readonly SdgbenefitService: SdgbenefitService) {}

  /**
   * this Api rout use for add sdg Benifites name and code
   * @param createsdgbenefitDto
   * @returns
   */
  @Post()
  create(@Body() createsdgbenefitDto: SdgBenefitDTO): Promise<SdgBenefit> {
    this.logger.verbose(`With in create`);
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
  findAll(): Promise<SdgBenefit[]> {
    this.logger.verbose(`With in findAll`);
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
    this.logger.verbose(`With in getFuelTypes`);
    const sdgbcode = this.SdgbenefitService.getSDGBCode();
    return sdgbcode.map((sdgb) => plainToClass(SDGBCodeNameDTO, sdgb));
  }
}
