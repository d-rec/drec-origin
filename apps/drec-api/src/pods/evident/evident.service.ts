import { Injectable, Logger } from '@nestjs/common';
import { createEvidentAxiosInstance } from '../../lib/evident';
import { EvidentSettingsService } from './evident-settings.service';
import { AxiosInstance } from 'axios';

@Injectable()
export class EvidentService {
  private readonly logger = new Logger(EvidentService.name);
  private apiUrl = process.env.IREC_EVIDENT_API_URL || null;

  constructor(
    private readonly evidentSettingsService: EvidentSettingsService,
  ) {}

  async getApiInstance(organizationId: number): Promise<AxiosInstance> {
    const data = await this.evidentSettingsService.find(organizationId);
    if (!data)
      throw new Error(
        `Evident instance not found for organization ${organizationId}`,
      );
    return createEvidentAxiosInstance({
      baseURL: this.apiUrl,
      apiKey: data.apiKey,
      organizationId: organizationId.toString(),
    });
  }

  async getRegistrantInfo(organizationId: number): Promise<any> {
    try {
      const evidentApiInstance = await this.getApiInstance(organizationId);
      const evidentSettings =
        await this.evidentSettingsService.find(organizationId);
      const user = await evidentApiInstance.get(
        `/users?q=${evidentSettings.email}`,
      );
      const userMember = user.data['hydra:member'][0];
      return {
        profile: user,
        member: userMember,
      };
    } catch (error) {
      this.logger.error('Error fetching registrant info:', error);
      throw error;
    }
  }
}
