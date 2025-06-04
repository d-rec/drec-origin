import { Body, Controller, Get, Logger, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { EvidentService } from './evident.service';
import { SettingsDTO } from './settings.dto';
import { UserDecorator } from '../user/decorators/user.decorator';
import { ILoggedInUser } from '../../models';
import { AuthVerifiedGuard } from '../../guards';

@ApiTags('Evident')
@ApiBearerAuth('access-token')
@Controller('evident')
export class EvidentController {
  private readonly logger = new Logger(EvidentController.name);

  constructor(private readonly eviidentService: EvidentService) {}

  @UseGuards(AuthVerifiedGuard(['jwt', 'oauth2-client-password']))
  @Post()
  @ApiOperation({ summary: 'Save Evident settings' })
  async saveSettings(
    @UserDecorator() { organizationId }: ILoggedInUser,
    @Body() settings: SettingsDTO,
  ): Promise<SettingsDTO> {
    this.logger.verbose(`About to save settings`);
    return this.eviidentService.save(organizationId, settings);
  }

  @UseGuards(AuthVerifiedGuard(['jwt', 'oauth2-client-password']))
  @Get()
  @ApiOperation({ summary: 'Get Evident settings' })
  async getSettings(
    @UserDecorator() { organizationId }: ILoggedInUser,
  ): Promise<any> {
    return this.eviidentService.findByOrganizationId(organizationId);
  }
}
