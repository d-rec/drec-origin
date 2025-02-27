import { applyDecorators } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { isNotEmpty } from 'class-validator';

export const Trim = (): PropertyDecorator =>
  applyDecorators(Transform((value?: string) => value?.trim()));

export const ConvertToNullIfEmpty = (): PropertyDecorator =>
  applyDecorators(
    Trim(),
    Transform((value?: string) => {
      if (!isNotEmpty(value)) return null;
      return value;
    }),
  );
