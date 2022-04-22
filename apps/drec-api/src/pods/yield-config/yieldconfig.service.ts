import {
  Injectable,
  NotFoundException,
  NotAcceptableException,
  Logger,
  ConflictException,
  UnprocessableEntityException,
  BadRequestException,
} from '@nestjs/common';
import { validate } from 'class-validator';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOneOptions, Repository } from 'typeorm';
import { IYieldConfig,ILoggedInUser } from '../../models'
import { NewYieldConfigDTO } from './dto/new-yieldconfig.dto';
import { defaults } from 'lodash';
import { YieldConfigDTO,UpdateYieldValueDTO} from './dto';
import { ExtendedBaseEntity } from '@energyweb/origin-backend-utils';
import { FindConditions, FindManyOptions, Between } from 'typeorm';
import cleanDeep from 'clean-deep';
export type TUserBaseEntity = ExtendedBaseEntity & IYieldConfig;
import { YieldConfig } from './yieldconfig.entity'
@Injectable()
export class YieldConfigService {
  private readonly logger = new Logger(YieldConfigService.name);

  constructor(
    @InjectRepository(YieldConfig) private readonly repository: Repository<YieldConfig>,
  ) { }
  async getAll(): Promise<YieldConfig[]> {
    console.log(this.repository.find())
    return this.repository.find();
  }


  public async create(data: NewYieldConfigDTO, loggedUser: any): Promise<YieldConfigDTO> {
   
    await this.checkForExistingyieldvalue(data.countryCode, data.countryName);
    if (data.yieldValue === 0 ) {
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
      
    });


    return new YieldConfig(yieldvalue);
  }
  private async checkForExistingyieldvalue(countryCode: string, countryname: string): Promise<void> {
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
  async findOne(conditions: FindConditions<YieldConfig>): Promise<TUserBaseEntity> {
    const yieldvalue = await (this.repository.findOne(conditions) as Promise<IYieldConfig> as Promise<TUserBaseEntity>);


    return yieldvalue;
  }
  async findById(id: number): Promise<IYieldConfig> {
    const user = this.findOne({ id });
    if (!user) {
      throw new NotFoundException(`No user found with id ${id}`);
    }
    return user;
  }
  async update(
    id: number,
    data: UpdateYieldValueDTO,
    // user:any
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
      status: data.status,
      
    });

    return this.findOne({ id });
  }


}