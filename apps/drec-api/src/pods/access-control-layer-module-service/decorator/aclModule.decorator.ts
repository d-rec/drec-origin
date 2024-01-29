import { SetMetadata, CustomDecorator } from '@nestjs/common';

export const ACLModules = (...acl_module: string[]): CustomDecorator<string> =>
  SetMetadata('acl_module', acl_module);
