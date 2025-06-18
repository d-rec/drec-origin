import { Body, Controller, Get, Logger, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { EvidentSettingsService } from './evident-settings.service';
import { SettingsDTO } from './settings.dto';
import { UserDecorator } from '../user/decorators/user.decorator';
import { ILoggedInUser } from '../../models';
import { AuthVerifiedGuard } from '../../guards';
import { EvidentService } from './evident.service';
import { DeviceService } from '../device/device.service';
@ApiTags('Evident')
@ApiBearerAuth('access-token')
@Controller('evident')
export class EvidentSettingsController {
  private readonly logger = new Logger(EvidentSettingsController.name);

  constructor(
    private readonly evidentSettingsService: EvidentSettingsService,
    private readonly evidentService: EvidentService,
    private readonly deviceService: DeviceService,
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
    return this.evidentSettingsService.findByOrganizationId(organizationId);
  }
  @UseGuards(AuthVerifiedGuard(['jwt', 'oauth2-client-password']))
  @Get('/devices/:code/status')
  @ApiOperation({ summary: 'Get device status by code' })
  async getDeviceStatus(
    @Param('code') code: string,
  ): Promise<any> {
    console.log(`Controller received device code: ${code}`);
    return this.evidentService.getDeviceStatus(code);
  }

  @UseGuards(AuthVerifiedGuard(['jwt', 'oauth2-client-password']))
  @Post('/devices/sync-status')
  @ApiOperation({ summary: 'Manually sync device statuses with Evident' })
  async syncDeviceStatuses(): Promise<any> {
    console.log('=== MANUAL DEVICE SYNC TRIGGERED ===');
    
    try {
      await this.deviceService.syncDeviceStatusesWithEvident();
      return { 
        success: true, 
        message: 'Device status synchronization completed successfully',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Manual sync failed:', error);
      return { 
        success: false, 
        message: 'Device status synchronization failed',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}
