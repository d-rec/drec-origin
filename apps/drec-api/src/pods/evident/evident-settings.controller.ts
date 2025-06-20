import { Body, Controller, Get, Logger, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { EvidentSettingsService } from './evident-settings.service';
import { SettingsDTO } from './settings.dto';
import { UserDecorator } from '../user/decorators/user.decorator';
import { ILoggedInUser } from '../../models';
import { AuthVerifiedGuard } from '../../guards';
import { EvidentService } from './evident.service';
import { IssuerDto } from './issue.dto';
import { TrrigerIssuanceRequestForOrganizationsService } from './trigger-Issuance-request-for-organizations';

@ApiTags('Evident')
@ApiBearerAuth('access-token')
@Controller('evident')
export class EvidentSettingsController {
  private readonly logger = new Logger(EvidentSettingsController.name);

  constructor(
    private readonly evidentSettingsService: EvidentSettingsService,
    private readonly evidentService: EvidentService,
    private readonly trrigerIssuanceRequestForOrganizationsService:TrrigerIssuanceRequestForOrganizationsService
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
  @Post('/issuer')
  @ApiOperation({ summary: 'Get Evident settings' })
  async triggerIssuanceRequests(
    @UserDecorator() { organizationId }: ILoggedInUser,
  ): Promise<any> {
    return this.trrigerIssuanceRequestForOrganizationsService.handleCron(organizationId,);
  }
}
// select * from check_certificate_issue_date_log_for_device