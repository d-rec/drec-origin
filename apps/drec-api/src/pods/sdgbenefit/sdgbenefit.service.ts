import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { SdgBenefitDTO, SDGBCodeNameDTO } from './dto/add_sdgbenefit.dto';
import { SdgBenefit } from './sdgbenefit.entity';
import { SDGBenefits } from '../../models/Sdgbenefit';
@Injectable()
export class SdgbenefitService {
  private readonly logger = new Logger(SdgbenefitService.name);

  constructor(
    @InjectRepository(SdgBenefit)
    private readonly repository: Repository<SdgBenefit>,
  ) {}

  public async create(createTestapiDto: SdgBenefitDTO): Promise<SdgBenefit> {
    this.logger.verbose(`With in create`);
    return await this.repository.save({
      ...createTestapiDto,
    });
  }

  public async findAll(): Promise<SdgBenefit[]> {
    this.logger.verbose(`With in findAll`);
    return this.repository.find();
  }

  getSDGBCode(): SDGBCodeNameDTO[] {
    this.logger.verbose(`With in getSDGBCode`);
    return SDGBenefits;
  }
}
