import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DeploymentPropertiesRepository } from './deployment-properties.repository';
import { DeploymentPropertiesEntity } from './deployment-properties.entity';
import { DeploymentProperties } from '../../types';

@Injectable()
export class DeploymentPropertiesPostgresRepository extends DeploymentPropertiesRepository {
  constructor(
    @InjectRepository(DeploymentPropertiesEntity)
    private repository: Repository<DeploymentPropertiesEntity>,
  ) {
    super();
  }

  public async get(): Promise<DeploymentProperties> {
    const [properties] = await this.repository.find();
    if (!properties) {
      throw new Error('No deployment properties');
    }
    return properties;
  }

  public async save(properties: DeploymentProperties): Promise<void> {
    if (await this.propertiesExist()) {
      throw new Error('Deployment properties already exist');
    }
    await this.repository.save(properties);
  }

  public async propertiesExist(): Promise<boolean> {
    const [properties] = await this.repository.find();
    return properties ? true : false;
  }
}
