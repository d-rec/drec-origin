import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthVerifiedGuard } from '../../guards';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TranslateService, TranslateResult, DeeplQuota } from './translate.service';
import { ApiKeyResolverService } from '../org-api-licenses/api-key-resolver.service';
import { UserDecorator } from '../user/decorators/user.decorator';
import { ILoggedInUser } from '../../models';

class TranslateDto {
  text: string[];
  target_lang: string;
}

@ApiTags('Translate')
@ApiBearerAuth('access-token')
@Controller('translate')
export class TranslateController {
  constructor(
    private readonly service: TranslateService,
    private readonly apiKeyResolver: ApiKeyResolverService,
  ) {}

  @Post()
  @UseGuards(AuthVerifiedGuard('jwt'))
  @ApiOperation({ summary: 'Translate text via DeepL' })
  async translate(
    @UserDecorator() user: ILoggedInUser,
    @Body() dto: TranslateDto,
  ): Promise<TranslateResult> {
    const apiKey = await this.apiKeyResolver.resolveDeeplKey(user);
    return this.service.translate(dto.text, dto.target_lang, apiKey, {
      userId: (user as any)?.id,
      organizationId: (user as any)?.organizationId,
    });
  }

  @Get('deepl-quota')
  @UseGuards(AuthVerifiedGuard('jwt'))
  @ApiOperation({ summary: 'DeepL character quota (does not consume credits)' })
  async deeplQuota(
    @UserDecorator() user: ILoggedInUser,
  ): Promise<DeeplQuota> {
    const apiKey = await this.apiKeyResolver.resolveDeeplKey(user);
    return this.service.getQuota(apiKey);
  }
}
