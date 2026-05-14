import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { AiAuditService } from '../ai/ai-audit.service';

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

export interface DeeplQuota {
  characterCount: number;
  characterLimit: number;
  percentUsed: number;
  tier: 'free' | 'pro';
}

@Injectable()
export class TranslateService {
  private readonly logger = new Logger(TranslateService.name);

  constructor(private readonly audit: AiAuditService) {}

  private deeplHost(apiKey: string): string {
    return apiKey.endsWith(':fx')
      ? 'https://api-free.deepl.com'
      : 'https://api.deepl.com';
  }

  async translate(
    texts: string[],
    targetLang: string,
    apiKey: string | undefined,
    ctx: { userId?: number; organizationId?: number } = {},
  ): Promise<TranslateResult> {
    if (!apiKey) {
      throw new BadRequestException('Translation is not configured — set the DeepL API key in Organization > Licenses');
    }

    const host = this.deeplHost(apiKey);
    const charCount = texts.reduce((s, t) => s + (t?.length ?? 0), 0);

    let res: Response;
    try {
      res = await fetch(`${host}/v2/translate`, {
        method: 'POST',
        headers: {
          Authorization: `DeepL-Auth-Key ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: texts, target_lang: targetLang }),
      });
    } catch (err: any) {
      void this.audit.recordCall({
        provider: 'deepl',
        endpoint: 'translate',
        inputTokens: charCount,
        userId: ctx.userId,
        organizationId: ctx.organizationId,
        success: false,
        errorMessage: err?.message ?? String(err),
      });
      throw new BadRequestException(`Translation failed: ${err?.message}`);
    }

    if (!res.ok) {
      const body = await res.text();
      this.logger.error(`DeepL API error ${res.status}: ${body}`);
      void this.audit.recordCall({
        provider: 'deepl',
        endpoint: 'translate',
        inputTokens: charCount,
        userId: ctx.userId,
        organizationId: ctx.organizationId,
        success: false,
        errorMessage: `${res.status}: ${body.slice(0, 200)}`,
      });
      throw new BadRequestException(`Translation failed: ${res.status}`);
    }

    const data: DeepLResponse = await res.json();
    void this.audit.recordCall({
      provider: 'deepl',
      endpoint: 'translate',
      inputTokens: charCount,
      userId: ctx.userId,
      organizationId: ctx.organizationId,
      success: true,
    });
    return { translations: data.translations };
  }

  /** DeepL's free quota introspection endpoint. Does NOT consume
   *  characters; safe to call as often as the UI wants. */
  async getQuota(apiKey: string | undefined): Promise<DeeplQuota> {
    if (!apiKey) {
      throw new BadRequestException('DeepL API key not configured');
    }
    const host = this.deeplHost(apiKey);
    const res = await fetch(`${host}/v2/usage`, {
      method: 'GET',
      headers: { Authorization: `DeepL-Auth-Key ${apiKey}` },
    });
    if (!res.ok) {
      const body = await res.text();
      throw new BadRequestException(`DeepL /v2/usage ${res.status}: ${body.slice(0, 200)}`);
    }
    const data = (await res.json()) as {
      character_count: number;
      character_limit: number;
    };
    const limit = data.character_limit || 1;
    return {
      characterCount: data.character_count,
      characterLimit: data.character_limit,
      percentUsed: Math.round((data.character_count / limit) * 1000) / 10,
      tier: apiKey.endsWith(':fx') ? 'free' : 'pro',
    };
  }
}
