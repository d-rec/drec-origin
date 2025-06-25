import { Body, Controller, Get, Logger, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { EvidentSettingsService } from './evident-settings.service';
import { SettingsDTO } from './settings.dto';
import { UserDecorator } from '../user/decorators/user.decorator';
import { ILoggedInUser } from '../../models';
import { AuthVerifiedGuard } from '../../guards';
import { mask } from '../../utils/mask';
import { EvidentSyncDeviceTaskService } from './evident-sync-device-task.service';

@ApiTags('Evident')
@ApiBearerAuth('access-token')
@Controller('evident')
export class EvidentSettingsController {
  private readonly logger = new Logger(EvidentSettingsController.name);

  constructor(
    private readonly evidentSettingsService: EvidentSettingsService,
    private readonly synchronizeDeviceStatuses: EvidentSyncDeviceTaskService,
  ) {}

  @UseGuards(AuthVerifiedGuard(['jwt', 'oauth2-client-password']))
  @Post()
  @ApiOperation({ summary: 'Save Evident settings' })
  async saveSettings(
    @UserDecorator() { organizationId }: ILoggedInUser,
    @Body() settings: SettingsDTO,
  ): Promise<SettingsDTO> {
    this.logger.verbose(`About to save settings`);
    return this.evidentSettingsService.save(organizationId, settings);
  }

  @UseGuards(AuthVerifiedGuard(['jwt', 'oauth2-client-password']))
  @Get()
  @ApiOperation({ summary: 'Get Evident settings' })
  async getSettings(
    @UserDecorator() { organizationId }: ILoggedInUser,
  ): Promise<any> {
    const settings = await this.evidentSettingsService.find(organizationId);
    if (!settings) return null;
    const maskedApiKey = mask(settings.apiKey);
    return {
      ...settings,
      apiKey: maskedApiKey,
    };
  }

  @UseGuards(AuthVerifiedGuard(['jwt', 'oauth2-client-password']))
  @Get('issuer-id')
  @ApiOperation({ summary: 'Get Evident issuer ID' })
  async getIssuerId(): Promise<any> {
    return await this.synchronizeDeviceStatuses.synchronizeDeviceStatuses();
  }
}
