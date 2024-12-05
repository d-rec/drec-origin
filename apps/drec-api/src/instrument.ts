import * as Sentry from '@sentry/nestjs';

if (process.env.NODE_ENV !== 'local') {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 1.0,
  });
}
