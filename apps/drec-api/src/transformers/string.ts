import { applyDecorators } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { isNotEmpty } from 'class-validator';

export const Trim = () => applyDecorators(
  Transform((value?: string) => value?.trim()),
);

export const ConvertToNullIfEmpty = () => applyDecorators(
  Trim(),
  Transform((value?: string) => {
    if (!isNotEmpty(value)) return null;
    return value;
  }),
);