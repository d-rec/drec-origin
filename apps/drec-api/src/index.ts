import {
  LoggerService,
  ValidationPipe,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import { Reflector, NestFactory } from '@nestjs/core';
import { NormalizeDatesInterceptor } from './interceptors/normalize-dates.interceptor';
import { SwaggerModule } from '@nestjs/swagger';
import { useContainer } from 'class-validator';
import fs from 'node:fs';
import 'reflect-metadata';
import * as PortUtils from './port';
import { setupRedoc } from './docs/redoc';
import { customizeDocument, getDocumentBuilder } from './docs/swagger';
import { version } from '../package.json';

import './sentry';
import { DRECModule } from './drec.module';
export { DRECModule } from './drec.module';

export async function startAPI(logger?: LoggerService): Promise<any> {
  const PORT = PortUtils.getPort();
  const getVersion = () => {
    let info;
    if (fs.existsSync(`${__dirname}/../../../package.json`)) {
      info = fs.readFileSync(`${__dirname}/../../../package.json`);
    } else {
      return 'unknown';
    }

    const parsed = JSON.parse(info.toString());

    return {
      '@energyweb/origin-drec-api': parsed.version,
    };
  };

  logger?.log(`Backend starting on port: ${PORT}`);
  logger?.log(`Backend versions: ${JSON.stringify(getVersion())}`);

  const app = await NestFactory.create(DRECModule, {
    ...(logger
      ? { logger }
      : {
          logger:
            process.env.NODE_ENV === 'development'
              ? ['log', 'debug', 'error', 'verbose', 'warn']
              : ['error', 'warn', 'log'],
        }),
  });

  app.useGlobalPipes(new ValidationPipe({ forbidUnknownValues: false }));
  app.useGlobalInterceptors(
    new ClassSerializerInterceptor(app.get(Reflector)),
    new NormalizeDatesInterceptor(),
  );

  app.enableShutdownHooks();

  const defaultOrigins = process.env.NODE_ENV === 'development'
    ? true
    : [
        'https://app.drecs.org',
        'https://stage.drecs.org',
        'https://stage-portal.drecs.org',
        'https://demo.drecs.org',
      ];
  const corsOrigin = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',')
    : defaultOrigins;

  app.enableCors({ origin: corsOrigin });
  app.setGlobalPrefix('api');

  useContainer(app.select(DRECModule), { fallbackOnErrors: true });

  if (logger) {
    app.useLogger(logger);
  }

  // Root route handler
  app.getHttpAdapter().get('/', (req, res) => {
    res.json({
      name: 'DREC API',
      version,
      status: 'operational',
      documentation: 'd-rec.github.io/drec-origin',
    });
  });

  if (process.env.NODE_ENV !== 'production') {
    const documentBuilder = getDocumentBuilder();
    const options = documentBuilder.build();

    const document = SwaggerModule.createDocument(app, options);
    const customizedDocument = customizeDocument(document);
    SwaggerModule.setup('swagger', app, customizedDocument);
    await setupRedoc(app, customizedDocument);
  }

  await app.listen(PORT);

  return app;
}
