import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { OrganizationService } from '../pods/organization/organization.service';
import { UserService } from '../pods/user/user.service';
import { Role } from '../pods/user/user.entity';

@Injectable()
export class OrganizationAccessValidator {
  constructor(
    private readonly organizationService: OrganizationService,
    private readonly userService: UserService
  ) {}

  async validate(organizationId: number, user: any): Promise<boolean> {
    console.log(organizationId)
    const senderorg = await this.organizationService.findOne(organizationId);
    const orguser = await this.userService.findByEmail(senderorg.orgEmail);

    if (user.organizationId !== organizationId && user.role !== Role.ApiUser) {
      throw new ConflictException({
        success: false,
        message: `Organization in measurement is not same as user's organization`,
      });
    }

    if (user.role === Role.ApiUser) {
      if (senderorg.api_user_id !== user.api_user_id) {
        throw new ConflictException({
          success: false,
          message: `Organization ${senderorg.name} in measurement is not part of your organization`,
        });
      }
      
      if (orguser.role !== Role.OrganizationAdmin) {
        throw new UnauthorizedException({
          success: false,
          message: 'Unauthorized',
        });
      }
      
      user.organizationId = organizationId;
      return true;
    }

    return true;
  }
}
