import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Anthropic from '@anthropic-ai/sdk';
import { AiAuditLog } from './ai-audit-log.entity';

const HAIKU_MODEL = 'claude-haiku-4-5-20251001';
const MAX_INPUT_CHARS = 8000;

export interface ClassifyDocumentInput {
  filename: string;
  text: string;
  validTypes: string[];
}

export interface ClassifyDocumentResult {
  suggestedType: string;
  confidence: number;
  reasoning: string;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private client: Anthropic | null = null;

  constructor(
    @InjectRepository(AiAuditLog)
    private readonly audit: Repository<AiAuditLog>,
  ) {}

  private getClient(): Anthropic {
    if (this.client) return this.client;
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new ServiceUnavailableException(
        'AI not configured: ANTHROPIC_API_KEY missing',
      );
    }
    this.client = new Anthropic({ apiKey });
    return this.client;
  }

  /**
   * Classify a document by content. Returns the best-matching slot
   * from `validTypes`, a confidence (0..1), and a one-sentence
   * reasoning string. Document text is truncated to MAX_INPUT_CHARS
   * since the first page is enough and we pay per token.
   */
  async classifyDocument(
    input: ClassifyDocumentInput,
    ctx: { userId?: number; organizationId?: number; deviceId?: number },
  ): Promise<ClassifyDocumentResult> {
    const text = (input.text || '').slice(0, MAX_INPUT_CHARS);
    const prompt = [
      `Classify this document into exactly one of the following types:`,
      input.validTypes.map((t) => `  - ${t}`).join('\n'),
      ``,
      `Filename: ${input.filename}`,
      `First-page text:`,
      `"""`,
      text,
      `"""`,
      ``,
      `Respond with strict JSON, no prose:`,
      `{"suggestedType": "<one of the listed types>", "confidence": <0..1>, "reasoning": "<one short sentence>"}`,
    ].join('\n');

    const startedAt = Date.now();
    let inputTokens = 0;
    let outputTokens = 0;
    let success = false;
    let errorMessage: string | null = null;
    try {
      const res = await this.getClient().messages.create({
        model: HAIKU_MODEL,
        max_tokens: 256,
        temperature: 0,
        messages: [{ role: 'user', content: prompt }],
      });
      inputTokens = res.usage?.input_tokens ?? 0;
      outputTokens = res.usage?.output_tokens ?? 0;
      const block = res.content.find((c) => c.type === 'text') as
        | { type: 'text'; text: string }
        | undefined;
      const raw = block?.text?.trim() ?? '';
      const parsed = this.parseJson(raw);
      if (
        !parsed ||
        typeof parsed.suggestedType !== 'string' ||
        !input.validTypes.includes(parsed.suggestedType)
      ) {
        throw new Error(`Model returned unparseable / off-list response: ${raw}`);
      }
      const result: ClassifyDocumentResult = {
        suggestedType: parsed.suggestedType,
        confidence: this.clampConfidence(parsed.confidence),
        reasoning: typeof parsed.reasoning === 'string' ? parsed.reasoning : '',
      };
      success = true;
      return result;
    } catch (err: any) {
      errorMessage = err?.message ?? String(err);
      throw err;
    } finally {
      void this.audit
        .insert({
          endpoint: 'classify-document',
          model: HAIKU_MODEL,
          inputTokens,
          outputTokens,
          userId: ctx.userId ?? null,
          organizationId: ctx.organizationId ?? null,
          deviceId: ctx.deviceId ?? null,
          success,
          errorMessage,
        })
        .catch((auditErr) =>
          this.logger.warn(`audit insert failed: ${auditErr?.message}`),
        );
      this.logger.log(
        `classify-document: ${success ? 'ok' : 'fail'} in=${inputTokens} out=${outputTokens} ${Date.now() - startedAt}ms`,
      );
    }
  }

  private parseJson(raw: string): any {
    try {
      return JSON.parse(raw);
    } catch {
      // Models occasionally wrap JSON in ```json fences despite instructions.
      const m = raw.match(/\{[\s\S]*\}/);
      if (m) {
        try {
          return JSON.parse(m[0]);
        } catch {
          return null;
        }
      }
      return null;
    }
  }

  private clampConfidence(v: any): number {
    const n = typeof v === 'number' ? v : parseFloat(v);
    if (!isFinite(n)) return 0.5;
    if (n < 0) return 0;
    if (n > 1) return 1;
    return n;
  }
}
