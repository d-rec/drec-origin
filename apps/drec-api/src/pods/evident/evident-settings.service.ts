import { Injectable } from '@nestjs/common';
import { SettingsDTO } from './settings.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { EvidentSettings } from './evident-settings.entity';
import { Repository } from 'typeorm';
import { mask, isMasked } from '../../utils/mask';
import { encrypt, decrypt } from '../../utils/crypto';

@Injectable()
export class EvidentSettingsService {
  constructor(
    @InjectRepository(EvidentSettings)
    private readonly repository: Repository<EvidentSettings>,
  ) {}

  async save(
    organizationId: number,
    settings: SettingsDTO,
  ): Promise<SettingsDTO> {
    const existingSettings = await this.repository.findOne({
      where: { organizationId },
    });

    if (!existingSettings) {
      return await this.repository.save({
        ...settings,
        apiKey: encrypt(settings.apiKey),
        organizationId,
      });
    }

    const apiKey = isMasked(settings.apiKey)
      ? existingSettings.apiKey
      : encrypt(settings.apiKey);

    const updated = this.repository.merge(existingSettings, {
      ...settings,
      apiKey,
      organizationId,
    });
    return await this.repository.save(updated);
  }

  async findByOrganizationId(organizationId: number): Promise<SettingsDTO> {
    const data = await this.repository.findOne({ where: { organizationId } });
    if (!data) return null;
    const maskedApiKey = mask(decrypt(data.apiKey));
    return {
      ...data,
      apiKey: maskedApiKey,
    };
  }

  async find(organizationId: number): Promise<EvidentSettings> {
    const data = await this.repository.findOne({
      where: { organizationId },
    });
    return data;
  }
}
