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
  ApiOperation,
} from '@nestjs/swagger';
import { SDGBenefitDTO, SDGBenefitCodeNameDTO } from './dto/add_sdgbenefit.dto';
import { SDGBenefitService } from './sdgbenefit.service'; // eslint-disable-line @typescript-eslint/no-unused-vars
import { plainToClass } from 'class-transformer';
import { SDGBenefit } from './sdgbenefit.entity';
@ApiTags('Sdg Benefit')
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
  @ApiOperation({
    summary: 'Add SDG benefit',
    description: 'Creates a new SDG benefit with the provided name and code.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    type: SDGBenefit,
    description: 'Successfully created a new SDG benefit.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid data provided for creating the SDG benefit.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden. User does not have the required permissions.',
  })
  create(@Body() createSDGBenefitDTO: SDGBenefitDTO): Promise<SDGBenefit> {
    this.logger.verbose(`With in create`);
    return this.sdgBenefitService.create(createSDGBenefitDTO);
  }

  /**
   *
   * @returns
   */
  @Get()
  @ApiOperation({
    summary: 'Get all SDG benefits',
    description: 'Returns a list of all SDG benefits stored in the database.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: [SDGBenefitCodeNameDTO],
    description: 'Successfully retrieved the list of SDG benefits.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden. User does not have the required permissions.',
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
  @ApiOperation({
    summary: 'Get all SDG benefit codes and names',
    description:
      'Returns a list of all SDG benefit codes and names from a predefined list (not stored in the database).',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: [SDGBenefitCodeNameDTO],
    description:
      'Successfully retrieved the list of SDG benefit codes and names.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden. User does not have the required permissions.',
  })
  getFuelTypes(): SDGBenefitCodeNameDTO[] {
    this.logger.verbose(`With in getFuelTypes`);
    const sdgBenefitCode = this.sdgBenefitService.getSDGBenefitCode();
    return sdgBenefitCode.map((sdgBenefit) =>
      plainToClass(SDGBenefitCodeNameDTO, sdgBenefit),
    );
  }
}
