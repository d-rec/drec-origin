import {
    Injectable,
    NotFoundException,
    NotAcceptableException,
    Logger,
    ConflictException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { SdgBenefitDTO } from './dto/add_sdgbenefit.dto';
import { SdgBenefit } from './sdgbenefit.entity'
@Injectable()
export class SdgbenefitService {
    private readonly logger = new Logger(SdgbenefitService.name);

    constructor(
        @InjectRepository(SdgBenefit) private readonly repository: Repository<SdgBenefit>,

    ) { }

    public async create(createTestapiDto: SdgBenefitDTO): Promise<SdgBenefit> {

        return await this.repository.save({
            ...createTestapiDto,
        });
    }


    public async findAll(): Promise<SdgBenefit[]> {

        return this.repository.find();
    }
}
