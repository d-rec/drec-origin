import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';
import { OrganizationAccessValidator } from './organization-access.validation';
import { ILoggedInUser } from '../models';

export function ValidateOrganizationAccess(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'ValidateOrganizationAccess',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: OrganizationAccessValidator,
      async: true,
    });
  };
}
