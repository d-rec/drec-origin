import { INestApplication } from '@nestjs/common';
import { OpenAPIObject } from '@nestjs/swagger';
import { RedocModule, RedocOptions } from '@jozefazz/nestjs-redoc';

export function setupRedoc(
  app: INestApplication,
  document: OpenAPIObject,
): Promise<void> {
  const redocOptions: RedocOptions = {
    title: 'D-REC API Documentation',
    logo: {
      url: 'https://portal.drecs.org/assets/images/d-rec-beta-logo.svg',
      altText: 'D-REC logo',
    },
    sortPropsAlphabetically: true,
  };
  return RedocModule.setup('/docs', app, document, redocOptions);
}
