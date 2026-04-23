import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthVerifiedGuard } from '../../guards';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TranslateService, TranslateResult } from './translate.service';

class TranslateDto {
  text: string[];
  target_lang: string;
}

@ApiTags('Translate')
@ApiBearerAuth('access-token')
@Controller('translate')
export class TranslateController {
  constructor(private readonly service: TranslateService) {}

  @Post()
  @UseGuards(AuthVerifiedGuard('jwt'))
  @ApiOperation({ summary: 'Translate text via DeepL' })
  translate(@Body() dto: TranslateDto): Promise<TranslateResult> {
    return this.service.translate(dto.text, dto.target_lang);
  }
}
