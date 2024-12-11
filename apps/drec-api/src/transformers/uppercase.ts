import { applyDecorators } from '@nestjs/common';
import { Transform } from 'class-transformer';

export const ToUpperCase = (): PropertyDecorator =>
  applyDecorators(
    Transform((value) => (typeof value === 'string' ? value.toUpperCase() : value)),
  )