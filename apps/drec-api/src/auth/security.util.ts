import { createHash } from 'crypto';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const logger = new Logger('AuthSecurity');

/**
 * Values that must never be used to sign/verify JWTs in a real deployment.
 * These were the historical in-code fallbacks and .env.example placeholders.
 */
const INSECURE_SECRETS = new Set([
  '',
  'thisisnotsecret',
  'my-secret',
  'secret',
  'changeme',
]);

/**
 * Anything that is not an explicit local/dev/test run is treated as
 * production-like and fails closed. This means a prod deployment with
 * NODE_ENV unset is still held to the strict rule.
 */
function isDevOrTest(): boolean {
  return ['development', 'test'].includes(process.env.NODE_ENV ?? '');
}

/**
 * Fetch a required signing secret.
 *
 * - In production-like environments, throws if the secret is missing OR set
 *   to a known-insecure placeholder (e.g. the old `my-secret` default). This
 *   makes a weak/forgeable JWT configuration fail loudly at startup instead of
 *   silently shipping.
 * - In development/test, a missing/insecure value is tolerated with a warning
 *   and a per-key dev fallback, so local work and CI are not blocked.
 */
export function requireSecret(
  configService: ConfigService,
  key: string,
): string {
  const value = (configService.get<string>(key) ?? '').trim();

  if (!value || INSECURE_SECRETS.has(value)) {
    const message = `[security] ${key} is missing or set to an insecure default; refusing to sign/verify JWTs with it. Set a strong random value (e.g. \`openssl rand -hex 32\`).`;
    if (!isDevOrTest()) {
      throw new Error(message);
    }
    logger.warn(`${message} Using an insecure development-only fallback.`);
    return value || `dev-insecure-${key}`;
  }

  return value;
}

/**
 * Deterministic hash used to store/look up session access tokens.
 *
 * The raw JWT must never be persisted: a database read would otherwise yield
 * usable bearer credentials. SHA-256 is appropriate here (the JWT is already
 * high-entropy, and we need constant-form equality lookup by column value).
 */
export function hashToken(token: string): string {
  return createHash('sha256').update(token.trim()).digest('hex');
}
