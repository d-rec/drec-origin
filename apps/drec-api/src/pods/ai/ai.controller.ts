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
}
