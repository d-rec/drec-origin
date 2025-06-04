import { Injectable } from '@nestjs/common';
import { SettingsDTO } from './settings.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { EvidentSettings } from './evident.entity';
import { Repository } from 'typeorm';
import { maskToken } from '../../utils/mask-token';
import { encrypt, decrypt } from '../../utils/crypto';

@Injectable()
export class EvidentService {
  private secretKey = process.env.ENCRYPTION_SECRET;
  constructor(
    @InjectRepository(EvidentSettings)
    private readonly repository: Repository<EvidentSettings>,
  ) {}

  async save(
    organizationId: number,
    settings: SettingsDTO,
  ): Promise<SettingsDTO> {
    const settingsExist = await this.repository.findOne({
      where: { organizationId },
    });

    settings = {
      ...settings,
      apiKey: encrypt(settings.apiKey, this.secretKey),
    };

    if (!settingsExist) {
      return await this.repository.save({
        ...settings,
        organizationId,
      });
    }

    const updatedFields: Partial<EvidentSettings> = {};
    let settingschanged = false;

    for (const key of Object.keys(settings)) {
      const newValue = settings[key];
      const oldValue = settingsExist[key];

      if (newValue !== oldValue) {
        updatedFields[key] = newValue;
        settingschanged = true;
      }
    }
    if (!settingschanged) return settingsExist;
    const updated = this.repository.merge(settingsExist, updatedFields);
    return await this.repository.save(updated);
  }

  async findByOrganizationId(organizationId: number): Promise<SettingsDTO> {
    const data = await this.repository.findOne({ where: { organizationId } });
    if (!data) return null;
    const maskedApiKey = maskToken(decrypt(data.apiKey, this.secretKey));
    return {
      ...data,
      apiKey: maskedApiKey,
    };
  }
}
