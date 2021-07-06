import { LoggerService, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { useContainer } from 'class-validator';
import fs from 'fs';
import { DrecModule } from './drec.module';

import * as PortUtils from './port';

export { DrecModule };

export async function startAPI(logger?: LoggerService) {
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

  console.log(`Backend starting on port: ${PORT}`);
  console.log(`Backend versions: ${JSON.stringify(getVersion())}`);

  const app = await NestFactory.create(DrecModule);

  app.useGlobalPipes(new ValidationPipe());

  app.enableShutdownHooks();
  app.enableCors();
  app.setGlobalPrefix('api');

  useContainer(app.select(DrecModule), { fallbackOnErrors: true });

  if (logger) {
    app.useLogger(logger);
  }

  const options = new DocumentBuilder()
    .setTitle('DREC Origin API')
    .setDescription('Swagger documentation for DREC Origin API')
    .setVersion('0.1')
    .addApiKey({ type: 'apiKey', in: 'header', name: 'api-key' }, 'drec')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'access-token',
    )
    .build();

  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('swagger', app, document);

  await app.listen(PORT);

  return app;
}
