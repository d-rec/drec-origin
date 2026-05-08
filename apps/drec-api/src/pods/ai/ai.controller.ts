import {
  Body,
  Controller,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsArray, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';
import { AuthVerifiedGuard } from '../../guards';
import { UserDecorator } from '../user/decorators/user.decorator';
import { ILoggedInUser } from '../../models';
import {
  AiService,
  ClassifyDocumentResult,
  ExtractSldFieldsResult,
} from './ai.service';
import { ApiKeyResolverService } from '../org-api-licenses/api-key-resolver.service';

class ClassifyDocumentDto {
  @IsString()
  @MaxLength(512)
  filename: string;

  @IsString()
  @MaxLength(20000)
  text: string;

  @IsArray()
  @IsString({ each: true })
  validTypes: string[];

  @IsOptional()
  @IsInt()
  deviceId?: number;
}

class ExtractSldFieldsDto {
  @IsString()
  @MaxLength(512)
  filename: string;

  // Base64-encoded image (PNG/JPEG/WEBP/GIF). Capped at ~7 MB encoded
  // (~5 MB raw) — Anthropic's per-image limit is 5 MB so anything
  // larger gets rejected anyway. The frontend should downsample to
  // ~1600px on the long edge before sending.
  @IsString()
  @MaxLength(7_500_000)
  imageBase64: string;

  @IsString()
  mimeType: 'image/png' | 'image/jpeg' | 'image/webp' | 'image/gif';

  @IsOptional()
  @IsInt()
  deviceId?: number;
}

@ApiTags('AI')
@ApiBearerAuth('access-token')
@Controller('ai')
export class AiController {
  constructor(
    private readonly service: AiService,
    private readonly apiKeyResolver: ApiKeyResolverService,
  ) {}

  @Post('classify-document')
  @UseGuards(AuthVerifiedGuard('jwt'))
  @ApiOperation({
    summary:
      'Classify a document via Claude Haiku (Tier-3 fallback to keyword classifier)',
  })
  async classifyDocument(
    @UserDecorator() user: ILoggedInUser,
    @Body() dto: ClassifyDocumentDto,
  ): Promise<ClassifyDocumentResult> {
    const apiKey = await this.apiKeyResolver.resolveAnthropicKey(user);
    return this.service.classifyDocument(
      { filename: dto.filename, text: dto.text, validTypes: dto.validTypes },
      apiKey,
      {
        userId: user.id,
        organizationId: user.organizationId,
        deviceId: dto.deviceId,
      },
    );
  }

  @Post('extract-sld-fields')
  @UseGuards(AuthVerifiedGuard('jwt'))
  @ApiOperation({
    summary:
      'Extract structured fields (capacity, inverter count, modules, etc.) from an SLD image via Claude Haiku vision',
  })
  async extractSldFields(
    @UserDecorator() user: ILoggedInUser,
    @Body() dto: ExtractSldFieldsDto,
  ): Promise<ExtractSldFieldsResult> {
    const apiKey = await this.apiKeyResolver.resolveAnthropicKey(user);
    return this.service.extractSldFields(
      {
        filename: dto.filename,
        imageBase64: dto.imageBase64,
        mimeType: dto.mimeType,
      },
      apiKey,
      {
        userId: user.id,
        organizationId: user.organizationId,
        deviceId: dto.deviceId,
      },
    );
  }
}
