import 'reflect-metadata';
import { LoggerService, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';
import { useContainer } from 'class-validator';
import fs from 'fs';
import { DRECModule } from './drec.module';
import * as PortUtils from './port';
import Redoc from 'redoc-express';
import { getDocumentBuilder } from './swagger';

export { DRECModule };

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

  const app = await NestFactory.create(DRECModule);

  app.useGlobalPipes(new ValidationPipe({ forbidUnknownValues: false }));

  app.enableShutdownHooks();
  app.enableCors();
  app.setGlobalPrefix('api');

  useContainer(app.select(DRECModule), { fallbackOnErrors: true });

  if (logger) {
    app.useLogger(logger);
  }

  const documentBuilder = getDocumentBuilder();
  const options = documentBuilder.build();

  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('swagger', app, document);

  app.use(
    '/docs',
    Redoc({
      title: 'D-REC Origin API',
      specUrl: '/swagger-json',
      nonce: '',
    }),
  );

  app.use('/swagger-json', (req, res) => {
    res.json(document);
  });

  app.getHttpAdapter().get('/health/liveness', (req, res) => res.send({ status: 'okay' }));
  app.getHttpAdapter().get('/health/readiness', (req, res) => res.send({ status: 'ready' }));

  await app.listen(PORT);

  return app;
}
