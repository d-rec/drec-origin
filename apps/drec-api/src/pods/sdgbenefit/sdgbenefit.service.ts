import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { SDGBenefitDTO, SDGBCodeNameDTO } from './dto/add_sdgbenefit.dto';
import { SDGBenefit } from './sdgbenefit.entity';
import { SDGBenefits } from '../../models/Sdgbenefit';
@Injectable()
export class SDGBenefitService {
  private readonly logger = new Logger(SDGBenefitService.name);

  constructor(
    @InjectRepository(SDGBenefit)
    private readonly repository: Repository<SDGBenefit>,
  ) {}

  public async create(createTestapiDto: SDGBenefitDTO): Promise<SDGBenefit> {
    this.logger.verbose(`With in create`);
    return await this.repository.save({
      ...createTestapiDto,
    });
  }

  public async findAll(): Promise<SDGBenefit[]> {
    this.logger.verbose(`With in findAll`);
    return this.repository.find();
  }

  getSDGBCode(): SDGBCodeNameDTO[] {
    this.logger.verbose(`With in getSDGBCode`);
    return SDGBenefits;
  }
}
