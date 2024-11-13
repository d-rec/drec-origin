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
import { ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';

@Injectable()
@ValidatorConstraint({ async: true })
export class OrganizationAccessValidator {
  private readonly logger = new Logger(OrganizationAccessValidator.name);

  constructor(
    private readonly organizationService: OrganizationService,
    private readonly userService: UserService,
  ) {}

  async validate(organizationId: number, user: ILoggedInUser ): Promise<boolean> {
    
    if (!organizationId) {
      return true; // Skip validation if no organizationId is provided
    }

    try {
      // Fetch organization and associated user details
      const senderOrg = await this.organizationService.findOne(organizationId);
      const orgUser = await this.userService.findByEmail(senderOrg.orgEmail);

      // Check if user's organization matches the measurement organization or if user has ApiUser role
      if (user.id !== organizationId && user.role !== Role.ApiUser) {
        this.logger.error(`Organization in measurement is not same as user's organization`);
        throw new ConflictException({
          success: false,
          message: `Organization in measurement is not same as user's organization`,
        });
      }

      // Further checks for ApiUser role
      if (user.role === Role.ApiUser) {
        if (senderOrg.api_user_id !== user.api_user_id) {
          this.logger.error(`Organization ${senderOrg.name} in measurement is not part of your organization`);
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
          // Optional: Modify user's organizationId if needed, though generally not advised within a validator
          user.organizationId = organizationId;
        }
      }

      return true; // Validation successful
    } catch (error) {
      this.logger.error(`Validation failed: ${error.message}`);
      throw error; // Re-throw the error to be handled by NestJS exception filters
    }
  }

  defaultMessage(args: ValidationArguments): string {
    return 'User does not have permission to access this organization.';
  }
}
