import { DeploymentPropertiesRepository } from './deployment-properties.repository';
import { DeploymentProperties } from '../../types';

export class DeploymentPropertiesRepositoryImpl extends DeploymentPropertiesRepository {
  async get(): Promise<DeploymentProperties> {
    return { registry: '', issuer: '' };
  }
  async save(properties: DeploymentProperties): Promise<void> {
    return;
  }
  async propertiesExist(): Promise<boolean> {
    return false;
  }
}
