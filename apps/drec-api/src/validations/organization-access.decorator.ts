import { ConflictException } from "@nestjs/common";
import { registerDecorator, ValidationArguments, ValidationOptions } from "class-validator";
import { OrganizationAccessValidator } from "./organization-access.validation";
import { OrganizationService } from "src/pods/organization/organization.service";

export function HasOrganizationAccess(validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      name: 'hasOrganizationAccess',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        async validate(value: number, args: ValidationArguments) {
          const context = args.object as {
            organizationService: OrganizationService;
            userService: any;
            user;
          };
          
          if (!context.organizationService || !context.userService || !context.user) {
            throw new ConflictException({
              success: false,
              message: 'Missing required services or user context',
            });
          }

          const validator = new OrganizationAccessValidator(
            context.organizationService,
            context.userService
          );

          try {
            return await validator.validate(value, context.user);
          } catch (error) {
            // Consider logging the error here
            throw error;
          }
        },        defaultMessage: () => 'User does not have access to this organization',
      },
    });
  };
}