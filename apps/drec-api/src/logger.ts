import * as winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import LokiTransport from 'winston-loki';
import { WinstonModule } from 'nest-winston';

const { combine, timestamp, json, printf, colorize, errors } = winston.format;

/**
 * Build a Winston logger instance configured from environment variables.
 *
 * Env vars:
 *   LOG_LEVEL           – min level to log          (default: "info")
 *   LOG_DIR             – directory for file logs    (default: "logs")
 *   LOG_FILE_ENABLED    – enable daily rotate files  (default: "false")
 *   LOKI_ENABLED        – push to Grafana Loki       (default: "false")
 *   LOKI_URL            – Loki push endpoint          (default: "http://localhost:3100")
 *   LOKI_AUTH_USER      – basic-auth user (optional)
 *   LOKI_AUTH_PASS      – basic-auth password (optional)
 *   LOKI_LABELS         – extra labels as JSON        (default: '{}')
 */
export function createWinstonLogger() {
  const level = process.env.LOG_LEVEL || 'info';
  const logDir = process.env.LOG_DIR || 'logs';
  const isProduction = process.env.NODE_ENV === 'production';

  // ── Formats ──────────────────────────────────────────────────────────────
  winston.addColors({
    error: 'red',
    warn: 'yellow',
    info: 'green',
    verbose: 'green',
    debug: 'white',
    log: 'green',
  });

  const consoleFormat = combine(
    colorize({ all: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    printf(({ timestamp, level, message, context, stack, ...meta }) => {
      const ctx = context ? `[${context}] ` : '';
      const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
      const stackStr = stack ? `\n${stack}` : '';
      return `${timestamp} ${level} ${ctx}${message}${metaStr}${stackStr}`;
    }),
  );

  const structuredFormat = combine(
    timestamp(),
    errors({ stack: true }),
    json(),
  );

  // ── Transports ───────────────────────────────────────────────────────────
  const transports: winston.transport[] = [
    new winston.transports.Console({
      level,
      format: isProduction ? structuredFormat : consoleFormat,
    }),
  ];

  // Daily rotate file transport
  if (process.env.LOG_FILE_ENABLED === 'true') {
    transports.push(
      new DailyRotateFile({
        dirname: logDir,
        filename: 'drec-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '30d',
        level,
        format: structuredFormat,
      }),
      new DailyRotateFile({
        dirname: logDir,
        filename: 'drec-error-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '90d',
        level: 'error',
        format: structuredFormat,
      }),
    );
  }

  // Grafana Loki transport
  if (process.env.LOKI_ENABLED === 'true') {
    const lokiUrl = process.env.LOKI_URL || 'http://localhost:3100';

    let extraLabels: Record<string, string> = {};
    try {
      extraLabels = JSON.parse(process.env.LOKI_LABELS || '{}');
    } catch {
      // ignore malformed JSON
    }

    const lokiOptions: any = {
      host: lokiUrl,
      labels: {
        app: 'drec-api',
        environment: process.env.NODE_ENV || 'development',
        ...extraLabels,
      },
      json: true,
      format: structuredFormat,
      replaceTimestamp: true,
      onConnectionError: (err: Error) => {
        console.error('Loki connection error:', err.message);
      },
    };

    if (process.env.LOKI_AUTH_USER) {
      lokiOptions.basicAuth = `${process.env.LOKI_AUTH_USER}:${process.env.LOKI_AUTH_PASS || ''}`;
    }

    transports.push(new LokiTransport(lokiOptions));
  }

  return winston.createLogger({
    level,
    defaultMeta: { service: 'drec-api' },
    transports,
  });
}

/**
 * Create a NestJS-compatible LoggerService backed by Winston.
 * Pass the result to `app.useLogger()` or NestFactory.create({ logger }).
 */
export function createNestWinstonLogger() {
  return WinstonModule.createLogger({
    instance: createWinstonLogger(),
  });
}
