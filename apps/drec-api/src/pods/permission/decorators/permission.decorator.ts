import { SetMetadata, CustomDecorator } from '@nestjs/common';

export const Permission = (...permission: string[]): CustomDecorator<string> =>
  SetMetadata('permission', permission);
