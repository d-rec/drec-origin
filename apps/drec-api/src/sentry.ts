import * as Sentry from '@sentry/nestjs';

const {SENTRY_DSN, SENTRY_ENV, MODE} = process.env;

Sentry.init({
  dsn: SENTRY_DSN,
  environment: SENTRY_ENV || 'development',
  tracesSampleRate: 1.0,
  enabled: SENTRY_DSN && MODE && !(['dev', 'local', 'development'].includes(MODE)),
});