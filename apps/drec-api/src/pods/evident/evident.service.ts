import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createEvidentAxiosInstance } from '../../lib/evident';
import { decrypt } from '../../utils/crypto';
import { EvidentSettings } from './evident-settings.entity';
import { Issuer } from './evident-issuer';

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

  async registerIssuance(
    organizationId: number,
    code: string,
    issuer: Issuer,
  ): Promise<any> {
    try {
      const evidentInstance = await this.getEvidentInstance(organizationId);
      const response = await evidentInstance.post('/issues', {
        device: `/devices/CDEVES10003`,
      });
      console.log('registered issueance succefully');
      await this.registerIssuanceDetails(organizationId, response.data, issuer);

      console.log('reached');
      return response;
    } catch (error) {
      console.error('Error registering issuance:', error.message);
      throw error;
    }
  }

  // draft,in progress, submitted,approved,rejected
  async registerIssuanceDetails(
    organizationId: number,
    data: any,
    issuer: Issuer,
  ): Promise<any> {
    const evidentInstance = await this.getEvidentInstance(organizationId);
    try {
      const details = await evidentInstance.post('/issue_details', {
        endDate: issuer.endDate,
        files: [],
        fuel: issuer.fuel,
        issue: data['@id'],
        issuerNotes: '',
        notes: issuer.notes,
        productionVolume: issuer.productionVolume,
        recipientAccount: issuer.recipientAccount,
        startDate: issuer.startDate,
        status: 'Draft',
      });
      return details;
    } catch (error) {
      console.error('Error registering issuance:', error.message);
      throw error;
    }
  }
}
