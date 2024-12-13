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
import { SDGBenefitDTO, SDGBenefitCodeNameDTO } from './dto/add_sdgbenefit.dto';
import { SDGBenefitService } from './sdgbenefit.service'; // eslint-disable-line @typescript-eslint/no-unused-vars
import { plainToClass } from 'class-transformer';
import { SDGBenefit } from './sdgbenefit.entity';
@ApiTags('SdgBenefit')
@ApiBearerAuth('access-token')
@ApiSecurity('drec')
@Controller('sdgbenefit')
export class SDGBenefitController {
  private readonly logger = new Logger(SDGBenefitController.name);

  constructor(private readonly sdgBenefitService: SDGBenefitService) {}

  /**
   * this Api rout use for add sdg Benifites name and code
   * @param createSDGBenefitDTO
   * @returns
   */
  @Post()
  create(@Body() createSDGBenefitDTO: SDGBenefitDTO): Promise<SDGBenefit> {
    this.logger.verbose(`With in create`);
    return this.sdgBenefitService.create(createSDGBenefitDTO);
  }

  /**
   *
   * @returns
   */
  @Get()
  @ApiResponse({
    status: HttpStatus.OK,
    type: [SDGBenefitCodeNameDTO],
    description: 'Returns all SDGBenefites',
  })
  findAll(): Promise<SDGBenefit[]> {
    this.logger.verbose(`With in findAll`);
    return this.sdgBenefitService.findAll();
  }

  /**
   * this api rout use for get all sdg benefit from class not any tbale
   * @returns {SDGBenefitCodeNameDTO}
   */
  @Get('/code')
  @ApiResponse({
    status: HttpStatus.OK,
    type: [SDGBenefitCodeNameDTO],
    description: 'Returns all SDGBenefites',
  })
  getFuelTypes(): SDGBenefitCodeNameDTO[] {
    this.logger.verbose(`With in getFuelTypes`);
    const sdgBenefitCode = this.sdgBenefitService.getSDGBenefitCode();
    return sdgBenefitCode.map((sdgBenefit) => plainToClass(SDGBenefitCodeNameDTO, sdgBenefit));
  }
}
