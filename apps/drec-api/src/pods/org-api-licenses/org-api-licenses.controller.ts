import {
  Body,
  Controller,
  Get,
  Logger,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { OrgApiLicensesService } from './org-api-licenses.service';
import { ApiKeyResolverService } from './api-key-resolver.service';
import { SaveApiKeysDTO } from './dto/save-api-keys.dto';
import { UserDecorator } from '../user/decorators/user.decorator';
import { ILoggedInUser } from '../../models';
import { AuthVerifiedGuard } from '../../guards';

@ApiTags('Organization API Licenses')
@ApiBearerAuth('access-token')
@Controller('org-api-licenses')
export class OrgApiLicensesController {
  private readonly logger = new Logger(OrgApiLicensesController.name);

  constructor(
    private readonly orgApiLicensesService: OrgApiLicensesService,
    private readonly apiKeyResolverService: ApiKeyResolverService,
  ) {}

  @Get()
  @UseGuards(AuthVerifiedGuard(['jwt', 'oauth2-client-password']))
  @ApiOperation({ summary: 'Get API license settings and credit balances' })
  @ApiResponse({ status: 200, description: 'Returns masked keys and credits' })
  async getSettings(
    @UserDecorator() { organizationId }: ILoggedInUser,
  ): Promise<any> {
    const settings =
      await this.orgApiLicensesService.findMasked(organizationId);
    if (!settings) {
      return {
        roboflowApiKey: null,
        roboflowWorkflowUrl: null,
        deeplApiKey: null,
        roboflowCreditsRemaining: 3,
        deeplCreditsRemaining: 3,
      };
    }
    return settings;
  }

  @Post()
  @UseGuards(AuthVerifiedGuard(['jwt', 'oauth2-client-password']))
  @ApiOperation({ summary: 'Save API keys for Roboflow and/or DeepL' })
  @ApiResponse({ status: 201, description: 'Keys saved successfully' })
  async saveSettings(
    @UserDecorator() { organizationId }: ILoggedInUser,
    @Body() dto: SaveApiKeysDTO,
  ): Promise<{ message: string }> {
    this.logger.verbose(`Saving API keys for org ${organizationId}`);
    await this.orgApiLicensesService.save(organizationId, dto);
    return { message: 'API keys saved successfully' };
  }

  @Get('credits')
  @UseGuards(AuthVerifiedGuard(['jwt', 'oauth2-client-password']))
  @ApiOperation({ summary: 'Get credit balances and own-key status' })
  @ApiResponse({ status: 200, description: 'Credit info for both services' })
  async getCredits(
    @UserDecorator() { organizationId }: ILoggedInUser,
  ): Promise<{
    roboflow: { credits: number; hasOwnKey: boolean };
    deepl: { credits: number; hasOwnKey: boolean };
  }> {
    const [roboflow, deepl] = await Promise.all([
      this.apiKeyResolverService.getCreditsInfo(organizationId, 'roboflow'),
      this.apiKeyResolverService.getCreditsInfo(organizationId, 'deepl'),
    ]);
    return { roboflow, deepl };
  }
}
