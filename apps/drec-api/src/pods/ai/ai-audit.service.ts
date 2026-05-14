import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AiAuditLog } from './ai-audit-log.entity';

export type AiProvider = 'anthropic' | 'roboflow' | 'deepl';

interface RecordCallInput {
  provider: AiProvider;
  endpoint: string;
  model?: string;
  inputTokens?: number;
  outputTokens?: number;
  userId?: number | null;
  organizationId?: number | null;
  deviceId?: number | null;
  success: boolean;
  errorMessage?: string | null;
}

/**
 * Thin wrapper around the ai_audit_log table so non-Anthropic providers
 * (Roboflow, DeepL) can record calls without needing the full AiService.
 * AiService still writes its own rows directly for Anthropic.
 */
@Injectable()
export class AiAuditService {
  private readonly logger = new Logger(AiAuditService.name);

  constructor(
    @InjectRepository(AiAuditLog)
    private readonly audit: Repository<AiAuditLog>,
  ) {}

  async recordCall(input: RecordCallInput): Promise<void> {
    try {
      await this.audit.insert({
        provider: input.provider,
        endpoint: input.endpoint,
        model: input.model ?? input.provider,
        inputTokens: input.inputTokens ?? 0,
        outputTokens: input.outputTokens ?? 0,
        userId: input.userId ?? null,
        organizationId: input.organizationId ?? null,
        deviceId: input.deviceId ?? null,
        success: input.success,
        errorMessage: input.errorMessage ?? null,
      });
    } catch (err: any) {
      this.logger.warn(`audit insert failed: ${err?.message}`);
    }
  }
}
