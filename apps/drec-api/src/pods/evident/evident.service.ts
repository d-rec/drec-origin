import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createEvidentAxiosInstance } from '../../lib/evident';
import { decrypt } from '../../utils/crypto';
import { EvidentSettings } from './evident-settings.entity';

@Injectable()
export class EvidentService {
  private apiUrl = process.env.IREC_EVIDENT_API_URL || null;

  constructor(
    @InjectRepository(EvidentSettings)
    private readonly evidentSettingRepository: Repository<EvidentSettings>,
  ) {}

  private async getEvidentInstance(organizationId: number) {
    const data = await this.evidentSettingRepository.findOne({
      where: { organizationId },
    });
    if (!data) return null;
    const apiKey = decrypt(data.apiKey);
    return createEvidentAxiosInstance({
      baseURL: this.apiUrl,
      apiKey,
      organizationId: organizationId.toString(),
    });
  }

  async fetchDevices(organizationId: number): Promise<any> {
    const evidentInstance = await this.getEvidentInstance(organizationId);
    const response = await evidentInstance.get('/devices');
    return response.data;
  }
}
