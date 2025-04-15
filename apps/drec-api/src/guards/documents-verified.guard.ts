import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { OrganizationService } from '../pods/organization/organization.service';

@Injectable()
export class DocumentsVerifiedGuard implements CanActivate {
  constructor(private readonly organizationService: OrganizationService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user || !user.organization.id) {
      throw new UnauthorizedException('User does not have an organization');
    }

    const organizationWithVerification = await this.organizationService.findOne(
      user.organization.id,
    );

    if (!organizationWithVerification) {
      throw new UnauthorizedException('Organization not found');
    }

    if (!organizationWithVerification.verifiedAt) {
      throw new UnauthorizedException({
        success: false,
        message: 'Your documents have not been verified yet.',
        errorType: 'documents',
      });
    }

    return true;
  }
}
