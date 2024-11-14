import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { OrganizationService } from '../pods/organization/organization.service';
import { UserService } from '../pods/user/user.service';
import { Role } from '../pods/user/user.entity';
import { ILoggedInUser } from '../models';
import {
  ValidationArguments,
  ValidatorConstraint,
  registerDecorator,
  ValidationOptions,
} from 'class-validator';

@Injectable()
@ValidatorConstraint({ async: true })
export class OrganizationAccessValidator {
  private readonly logger = new Logger(OrganizationAccessValidator.name);

  constructor(
    private readonly organizationService: OrganizationService,
    private readonly userService: UserService,
  ) {}

  async validate(
    organizationId: number,
    user: ILoggedInUser,
  ): Promise<boolean> {
    try {
      const senderOrg = await this.organizationService.findOne(organizationId);
      const orgUser = await this.userService.findByEmail(senderOrg.orgEmail);

      if (user.organizationId !== organizationId && user.role !== Role.ApiUser) {
        this.logger.error(
          `Organization in measurement is not same as user's organization`,
        );
        throw new ConflictException({
          success: false,
          message: `Organization in measurement is not same as user's organization`,
        });
      }

      if (user.role === Role.ApiUser) {
        if (senderOrg.api_user_id !== user.api_user_id) {
          this.logger.error(
            `Organization ${senderOrg.name} in measurement is not part of your organization`,
          );
          throw new ConflictException({
            success: false,
            message: `Organization ${senderOrg.name} in measurement is not part of your organization`,
          });
        } else if (orgUser.role !== Role.OrganizationAdmin) {
          this.logger.error(`Unauthorized`);
          throw new UnauthorizedException({
            success: false,
            message: `Unauthorized`,
          });
        } else {
          user.organizationId = organizationId;
        }
      }

      return true;
    } catch (error) {
      this.logger.error(`Validation failed: ${error.message}`);
      throw error;
    }
  }

  defaultMessage(args: ValidationArguments): string {
    return 'User does not have permission to access this organization.';
  }
}

export function ValidateOrganizationAccess(
  validationOptions?: ValidationOptions,
) {
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
