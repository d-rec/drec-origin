import { DocumentBuilder } from '@nestjs/swagger';
import Tags from './tags';

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

  Tags.forEach((tag) => options.addTag(tag.name, tag.description));

  return options;
};
