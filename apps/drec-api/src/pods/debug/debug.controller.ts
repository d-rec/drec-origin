import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

interface BrowserLogEntry {
  level: 'log' | 'info' | 'warn' | 'error';
  time: string;
  message: string;
  args?: unknown[];
  stack?: string;
}

interface BrowserLogPayload {
  sessionId: string;
  url: string;
  userAgent?: string;
  email?: string;
  events: BrowserLogEntry[];
}

/**
 * Receives browser console events from the drec-ui and pipes them into the
 * api pod's stdout. Lets a maintainer watching `kubectl logs -f drec-api ...`
 * see the user's browser console live, without asking the user to F12 +
 * screenshot every time.
 *
 * Strict scoping (defence in depth — the UI already gates this on stage +
 * `?debug=1`, but defending the endpoint too):
 *   - returns 204 immediately on prod (NODE_ENV / MODE === 'production')
 *   - no payload validation beyond shape: this is a debugging firehose,
 *     not a structured API
 *
 * No auth — stage only, public route. Risk surface is "an attacker can fill
 * our pod logs with garbage." Acceptable for stage; would not enable on prod.
 */
@ApiTags('Debug')
@Controller('debug')
export class DebugController {
  private readonly logger = new Logger('browser');

  @Post('browser-log')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary:
      'Sink for browser console events streamed from the UI when ?debug=1 is set on stage',
  })
  async ingest(@Body() body: BrowserLogPayload): Promise<void> {
    if (
      process.env.MODE === 'production' ||
      process.env.NODE_ENV === 'production'
    ) {
      return; // hard-stop on prod
    }
    if (!body?.events?.length) return;

    const tag = `[${body.sessionId?.slice(0, 8) ?? '????'}@${body.email ?? 'anon'} ${body.url}]`;
    for (const e of body.events) {
      const argsStr =
        e.args && e.args.length
          ? ' ' + e.args.map((a) => safeStringify(a)).join(' ')
          : '';
      const stackStr = e.stack ? `\n${e.stack}` : '';
      const line = `${tag} ${e.level} ${e.message}${argsStr}${stackStr}`;
      switch (e.level) {
        case 'error':
          this.logger.error(line);
          break;
        case 'warn':
          this.logger.warn(line);
          break;
        default:
          this.logger.log(line);
      }
    }
  }
}

function safeStringify(v: unknown): string {
  try {
    if (typeof v === 'string') return v;
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}
