import { applyDecorators } from '@nestjs/common';
import { Transform } from 'class-transformer';

export const Trim = (): PropertyDecorator =>
  applyDecorators(Transform((value) => value.trim()));
