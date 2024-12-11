import * as Sentry from '@sentry/nestjs';

const {SENTRY_DSN, SENTRY_ENV, SENTRY_ENABLED} = process.env;

Sentry.init({
  dsn: SENTRY_DSN,
  environment: SENTRY_ENV || 'development',
  tracesSampleRate: 1.0,
  enabled: SENTRY_DSN && SENTRY_ENABLED?.toLowerCase() === 'true',
});