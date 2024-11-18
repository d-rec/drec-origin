import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ConflictException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { OrganizationService } from '../pods/organization/organization.service';
import { UserService } from '../pods/user/user.service';
import { Role } from '../pods/user/user.entity';

@Injectable()
export class OrganizationManageGuard implements CanActivate {
  private readonly logger = new Logger(OrganizationManageGuard.name);

  constructor(
    private readonly organizationService: OrganizationService,
    private readonly userService: UserService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const organizationId = request.body.organizationId;

    if (!user || !organizationId) {
      throw new UnauthorizedException('User or organizationId not provided');
    }

    const senderOrg = await this.organizationService.findOne(organizationId);
    const orgUser = await this.userService.findByEmail(senderOrg.orgEmail);

    if (user.id !== organizationId && user.role !== Role.ApiUser) {
      this.logger.error(`Organization mismatch`);
      throw new ConflictException(
        "Organization in measurement is not same as user's organization",
      );
    }

    if (
      user.role === Role.ApiUser &&
      senderOrg.api_user_id !== user.api_user_id
    ) {
      this.logger.error(`User lacks organization access`);
      throw new ConflictException(
        `Organization ${senderOrg.name} not accessible to user`,
      );
    }
    if (user.role === Role.ApiUser && orgUser.role !== Role.OrganizationAdmin) {
      this.logger.error(`Unauthorized`);
      throw new UnauthorizedException(`Unauthorized`);
    }

    return true;
  }
}
