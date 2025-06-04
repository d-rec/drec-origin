import { Injectable } from '@nestjs/common';
import { SettingsDTO } from './settings.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { EvidentIntegration } from './evident.entity';
import { Repository } from 'typeorm';
import { maskToken } from '../../utils/mask-token';

@Injectable()
export class EvidentService {
  constructor(
    @InjectRepository(EvidentIntegration)
    private readonly repository: Repository<EvidentIntegration>,
  ) {}

  async save(
    organizationId: number,
    settings: SettingsDTO,
  ): Promise<SettingsDTO> {
    const settingsExist = await this.repository.findOne({
      where: { organizationId },
    });

    if (!settingsExist) {
      return await this.repository.save({
        ...settings,
        organizationId,
      });
    }

    const updatedFields: Partial<EvidentIntegration> = {};
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
    const maskedApiKey = maskToken(data.apiKey);

    return {
      ...data,
      apiKey: maskedApiKey,
    };
  }
}
