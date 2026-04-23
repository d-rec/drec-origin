import { Injectable, Logger, BadRequestException } from '@nestjs/common';

interface DeepLTranslation {
  detected_source_language: string;
  text: string;
}

interface DeepLResponse {
  translations: DeepLTranslation[];
}

export interface TranslateResult {
  translations: { detected_source_language: string; text: string }[];
}

@Injectable()
export class TranslateService {
  private readonly logger = new Logger(TranslateService.name);

  async translate(
    texts: string[],
    targetLang: string,
  ): Promise<TranslateResult> {
    const apiKey = process.env.DEEPL_API_KEY;
    if (!apiKey) {
      throw new BadRequestException('Translation is not configured');
    }

    const host = apiKey.endsWith(':fx')
      ? 'https://api-free.deepl.com'
      : 'https://api.deepl.com';

    const res = await fetch(`${host}/v2/translate`, {
      method: 'POST',
      headers: {
        Authorization: `DeepL-Auth-Key ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: texts, target_lang: targetLang }),
    });

    if (!res.ok) {
      const body = await res.text();
      this.logger.error(`DeepL API error ${res.status}: ${body}`);
      throw new BadRequestException(`Translation failed: ${res.status}`);
    }

    const data: DeepLResponse = await res.json();
    return { translations: data.translations };
  }
}
