import { Injectable } from '@nestjs/common';
import { AxiosInstance } from 'axios';
import { createEvidentAxiosInstance } from '../../utils/axios';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EvidentSettings } from './evident-settings.entity';
import { decrypt } from '../../utils/crypto';

@Injectable()
export class EvidentService {
  private apiUrl = process.env.IREC_EVIDENT_API_URL || null;
  private apiKey: string | null = null;
  private axiosInstance: AxiosInstance;

  constructor(
    @InjectRepository(EvidentSettings)
    private readonly evidentSettingRepository: Repository<EvidentSettings>,
  ) {}

  async getDecryptedApiKey(organizationId: number): Promise<void> {
    const data = await this.evidentSettingRepository.findOne({
      where: { organizationId },
    });
    if (!data) return null;
    this.apiKey = decrypt(data.apiKey);
    this.axiosInstance = createEvidentAxiosInstance({
      baseURL: this.apiUrl,
      getApiKey: () => this.apiKey,
    });
  }
  async fetchDevices(organizationId: number): Promise<any> {
    await this.getDecryptedApiKey(organizationId);
    const response = await this.axiosInstance.get('/devices');
    return response.data;
  }
}
