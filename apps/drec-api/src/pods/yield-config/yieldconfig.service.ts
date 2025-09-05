import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { validate } from 'class-validator';
import { InjectRepository } from '@nestjs/typeorm';
import { FindConditions, Repository } from 'typeorm';
import { ILoggedInUser, IYieldConfig } from '../../models';
import { NewYieldConfigDTO } from './dto/new-yieldconfig.dto';
import { UpdateYieldValueDTO, YieldConfigDTO } from './dto';
import { ExtendedBaseEntity } from '../../lib/entity/extended-base-entity';
import { YieldConfig } from './yieldconfig.entity';

export type TUserBaseEntity = ExtendedBaseEntity & IYieldConfig;

@Injectable()
export class YieldConfigService {
  private readonly logger = new Logger(YieldConfigService.name);

  constructor(
    @InjectRepository(YieldConfig)
    private readonly repository: Repository<YieldConfig>,
  ) {}
  async getAll(): Promise<YieldConfig[]> {
    this.logger.verbose(this.repository.find());
    return this.repository.find();
  }

  public async create(
    data: NewYieldConfigDTO,
    loggedUser: ILoggedInUser,
  ): Promise<YieldConfigDTO> {
    await this.checkForExistingYieldValue(data.countryCode, data.countryName);
    if (data.yieldValue === 0) {
      throw new BadRequestException({
        success: false,
        message: `add the valid yield value`,
      });
    }
    const yieldValue = await this.repository.save({
      countryCode: data.countryCode,
      countryName: data.countryName,
      yieldValue: data.yieldValue,
      created_By: loggedUser.id,
      status: data.status,
    });

    return new YieldConfig(yieldValue);
  }
  private async checkForExistingYieldValue(
    countryCode: string,
    countryName: string,
  ): Promise<void> {
    const isExistingUser = await this.hasValue({ countryCode });
    if (isExistingUser) {
      const message = `Yield value  for this country ${countryName} already exists`;

      this.logger.error(message);
      throw new ConflictException({
        success: false,
        message,
      });
    }
  }
  private async hasValue(conditions: FindConditions<YieldConfig>) {
    return Boolean(await this.findOne(conditions));
  }
  async findOne(
    conditions: FindConditions<YieldConfig>,
  ): Promise<TUserBaseEntity> {
    return await (this.repository.findOne(
      conditions,
    ) as Promise<IYieldConfig> as Promise<TUserBaseEntity>);
  }
  async findById(id: number): Promise<IYieldConfig> {
    const yieldValueById = this.findOne({ id });
    if (!yieldValueById) {
      throw new NotFoundException(`No Yield value found with id ${id}`);
    }
    return yieldValueById;
  }

  async findByCountryCode(countryCode: string): Promise<any> {
    return await this.repository.findOne({
      where: {
        countryCode: countryCode,
      },
    });
  }

  async update(
    id: number,
    data: UpdateYieldValueDTO,
    user: ILoggedInUser,
  ): Promise<ExtendedBaseEntity & IYieldConfig> {
    await this.findById(id);
    const validationErrors = await validate(data, {
      skipUndefinedProperties: true,
    });

    if (validationErrors.length > 0) {
      throw new UnprocessableEntityException({
        success: false,
        errors: validationErrors,
      });
    }

    await this.repository.update(id, {
      yieldValue: data.yieldValue,
      // status: data.status,
      updated_By: user.id,
    });

    return this.findOne({ id });
  }
}
