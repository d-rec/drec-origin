import { DocumentBuilder, OpenAPIObject } from '@nestjs/swagger';
import Tags from './tags';
import Paths from './paths';

export const getDocumentBuilder = (): DocumentBuilder => {
  const options = new DocumentBuilder()
    .setTitle('D-REC Origin API')
    .setDescription(
      'This document outlines the D-REC Origin API Specification to accompany Version 1. The functionality outlined within each API interaction represents the recommended minimum required details necessary to implement a request on the D-REC Origin API',
    )
    .setVersion('0.1')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'access-token',
    );

  Tags.sort((a, b) => a.name.localeCompare(b.name)).forEach((tag) =>
    options.addTag(tag.name, tag.description),
  );

  return options;
};

export const customizeDocument = (document: OpenAPIObject): OpenAPIObject => {
  Paths.filter(({ endpoint }) => document.paths[endpoint]).forEach((item) => {
    document.paths[item.endpoint][item.method].summary = item.summary;
    document.paths[item.endpoint][item.method].description = item.description;
    if (item.tag) {
      document.paths[item.endpoint][item.method].tags = [item.tag];
    }
  });
  return document;
};
