import {
  Injectable,
  NotFoundException,
  Logger,
  ConflictException,
  UnprocessableEntityException,
  BadRequestException,
} from '@nestjs/common';
import { validate } from 'class-validator';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IYieldConfig, ILoggedInUser } from '../../models';
import { NewYieldConfigDTO } from './dto/new-yieldconfig.dto';
import { YieldConfigDTO, UpdateYieldValueDTO } from './dto';
import { ExtendedBaseEntity } from '@energyweb/origin-backend-utils';
import { FindConditions } from 'typeorm';

export type TUserBaseEntity = ExtendedBaseEntity & IYieldConfig;
import { YieldConfig } from './yieldconfig.entity';
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
    loggedUser: any,
  ): Promise<YieldConfigDTO> {
    await this.checkForExistingyieldvalue(data.countryCode, data.countryName);
    if (data.yieldValue === 0) {
      throw new BadRequestException({
        success: false,
        message: `add the valid yield value`,
      });
    }
    const yieldvalue = await this.repository.save({
      countryCode: data.countryCode,
      countryName: data.countryName,
      yieldValue: data.yieldValue,
      created_By: loggedUser.id,
      status: data.status,
    });

    return new YieldConfig(yieldvalue);
  }
  private async checkForExistingyieldvalue(
    countryCode: string,
    countryname: string,
  ): Promise<void> {
    const isExistingUser = await this.hasvalue({ countryCode });
    if (isExistingUser) {
      const message = `Yield value  for this country ${countryname} already exists`;

      this.logger.error(message);
      throw new ConflictException({
        success: false,
        message,
      });
    }
  }
  private async hasvalue(conditions: FindConditions<YieldConfig>) {
    return Boolean(await this.findOne(conditions));
  }
  async findOne(
    conditions: FindConditions<YieldConfig>,
  ): Promise<TUserBaseEntity> {
    const yieldvalue = await (this.repository.findOne(
      conditions,
    ) as Promise<IYieldConfig> as Promise<TUserBaseEntity>);

    return yieldvalue;
  }
  async findById(id: number): Promise<IYieldConfig> {
    const yieldvaluebyId = this.findOne({ id });
    if (!yieldvaluebyId) {
      throw new NotFoundException(`No Yield value found with id ${id}`);
    }
    return yieldvaluebyId;
  }

  async findByCountryCode(countryCode: string) {
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
