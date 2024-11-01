import { Injectable, ConflictException, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';
import { OrganizationService } from '../pods/organization/organization.service';
import { UserService } from '../pods/user/user.service';
import { Role } from '../pods/user/user.entity';


@Injectable()
export class OrganizationAccessValidator {
  constructor(
    private readonly organizationService: OrganizationService,
    private readonly userService: UserService
  ) {}

  async validate(organizationId: number, user): Promise<boolean> {
    try {
      // Input validation
      if (!organizationId || !user) {
        throw new ConflictException({
          success: false,
          message: 'Invalid input: organizationId and user are required',
        });
      }

      // Fetch organization data
      const organization = await this.organizationService.findOne(organizationId);
      if (!organization) {
        throw new NotFoundException({
          success: false,
          message: `Organization with ID ${organizationId} not found`,
        });
      }

      // Fetch organization user data
      const orgUser = await this.userService.findByEmail(organization.orgEmail);
      if (!orgUser) {
        throw new NotFoundException({
          success: false,
          message: `Organization user with email ${organization.orgEmail} not found`,
        });
      }

      // Regular user validation
      if (user.role !== Role.ApiUser) {
        if (user.organizationId !== organizationId) {
          throw new ConflictException({
            success: false,
            message: 'Organization in measurement does not match user\'s organization',
          });
        }
        return true;
      }

      // API user validation
      if (organization.api_user_id !== user.api_user_id) {
        throw new ConflictException({
          success: false,
          message: `Organization ${organization.name} is not part of your organization`,
        });
      }

      if (orgUser.role !== Role.OrganizationAdmin) {
        throw new UnauthorizedException({
          success: false,
          message: 'Organization user must have admin role',
        });
      }

      user.organizationId = organizationId;
      return true;
    } catch (error) {
      // Log the error here if needed
      throw error;
    }
  }
}