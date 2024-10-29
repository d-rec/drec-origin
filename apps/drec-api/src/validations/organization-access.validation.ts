import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';
import { Injectable } from '@nestjs/common';
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
    const senderorg = await this.organizationService.findOne(organizationId);
    const orguser = await this.userService.findByEmail(senderorg.orgEmail);

    if (user.role === Role.ApiUser) {
      if (senderorg.api_user_id !== user.api_user_id) {
        return false;
      }
      return orguser.role === Role.OrganizationAdmin;
    }

    return user.organizationId === organizationId;
  }
}
