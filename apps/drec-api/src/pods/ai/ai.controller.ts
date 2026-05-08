import {
  Body,
  Controller,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AuthVerifiedGuard } from '../../guards';
import { UserDecorator } from '../user/decorators/user.decorator';
import { ILoggedInUser } from '../../models';
import {
  AiService,
  ClassifyDocumentResult,
  ExtractSf02cFieldsResult,
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

class SldImageDto {
  @IsString()
  @MaxLength(7_500_000)
  base64: string;

  @IsString()
  mimeType: 'image/png' | 'image/jpeg' | 'image/webp' | 'image/gif';
}

class ExtractSf02cFieldsDto {
  @IsString()
  @MaxLength(512)
  filename: string;

  @IsOptional()
  @IsString()
  @MaxLength(20000)
  text?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(4)
  @ValidateNested({ each: true })
  @Type(() => SldImageDto)
  images?: SldImageDto[];

  @IsOptional()
  @IsInt()
  deviceId?: number;
}

class ExtractSldFieldsDto {
  @IsString()
  @MaxLength(512)
  filename: string;

  // 1..4 base64-encoded page images (PNG/JPEG/WEBP/GIF). Capped at
  // ~7 MB per encoded image — Anthropic's per-image limit is 5 MB.
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(4)
  @ValidateNested({ each: true })
  @Type(() => SldImageDto)
  images: SldImageDto[];

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

  @Post('extract-sf02c-fields')
  @UseGuards(AuthVerifiedGuard('jwt'))
  @ApiOperation({
    summary:
      'Extract owner / project / signing fields from an SF-02c letter',
  })
  async extractSf02cFields(
    @UserDecorator() user: ILoggedInUser,
    @Body() dto: ExtractSf02cFieldsDto,
  ): Promise<ExtractSf02cFieldsResult> {
    const apiKey = await this.apiKeyResolver.resolveAnthropicKey(user);
    return this.service.extractSf02cFields(
      {
        filename: dto.filename,
        text: dto.text,
        images: dto.images,
      },
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
        images: dto.images,
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
