import { registerDecorator, ValidationOptions } from 'class-validator';
import { OrganizationAccessValidator } from './organization-access.validation';


export function HasOrganizationAccess(validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      name: 'hasOrganizationAccess',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        async validate(value: number, args: any) {
          const validator = new OrganizationAccessValidator(
            args.object.organizationService,
            args.object.userService
          );
          return validator.validate(value, args.object.user);
        },
        defaultMessage: () => 'User does not have access to this organization',
      },
    });
  };
}
