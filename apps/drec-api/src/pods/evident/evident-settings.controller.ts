import {
  Body,
  Controller,
  Get,
  Logger,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { EvidentSettingsService } from './evident-settings.service';
import { SettingsDTO } from './settings.dto';
import { UserDecorator } from '../user/decorators/user.decorator';
import { ILoggedInUser } from '../../models';
import { AuthVerifiedGuard } from '../../guards';
import { mask } from '../../utils/mask';
import { EvidentIssuersDTO } from './evident-issuers.dto';
import { EvidentIssuersEntity } from './evident-issuers.entity';
import { EvidentService } from './evident.service';
import { Roles } from '../user/decorators/roles.decorator';
import { Role } from '../../utils/enums/role.enum';

@ApiTags('Evident')
@ApiBearerAuth('access-token')
@Controller('evident')
export class EvidentSettingsController {
  private readonly logger = new Logger(EvidentSettingsController.name);

  constructor(
    private readonly evidentSettingsService: EvidentSettingsService,
    private readonly evidentService: EvidentService,
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

  @Post('/register-issuer')
  @UseGuards(AuthVerifiedGuard(['jwt', 'oauth2-client-password']))
  @Roles(Role.Admin)
  @ApiBody({ type: EvidentIssuersDTO })
  async registerIssuer(
    @Body() createIssuerDto: EvidentIssuersDTO,
  ): Promise<EvidentIssuersEntity> {
    this.logger.verbose(`With in registerIssuer`);
    return await this.evidentService.registerIssuer(createIssuerDto);
  }

  @Get('/issuers')
  @UseGuards(AuthVerifiedGuard(['jwt', 'oauth2-client-password']))
  @Roles(Role.Admin)
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  async getIssuers(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    this.logger.verbose(`With in getting issuers`);
    const { data, total } = await this.evidentService.getIssuers(page, limit);
    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }
}
