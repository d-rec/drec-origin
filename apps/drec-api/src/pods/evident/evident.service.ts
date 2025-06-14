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
  async getDeviceStatus(code: string): Promise<string> {
    try {
      const response = await this.axiosInstance.get(`/devices/${code}`);
      const externalStatus = response.data?.status;
      return this.mapStatus(externalStatus);
    } catch (error) {
      console.error(
        `Failed to fetch device status for ID ${code}:`,
        error.message,
      );
      throw new Error(`Failed to fetch status from Evident`);
    }
  }

  private mapStatus(externalStatus: string): string {
    const statusMap = {
      approved: 'APPROVED',
      submitted: 'SUBMITTED',
      draft: 'DRAFT',
    };

    return statusMap[externalStatus?.toLowerCase()] ?? 'UNKNOWN';
  }
}
