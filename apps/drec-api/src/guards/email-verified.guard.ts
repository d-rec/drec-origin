import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { UserService } from '../pods/user/user.service';

@Injectable()
export class EmailVerifiedGuard implements CanActivate {
  constructor(private readonly userService: UserService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user || !user.id) {
      throw new UnauthorizedException('User not authenticated');
    }

    const userWithVerification = await this.userService.findById(user.id);

    if (!userWithVerification) {
      throw new UnauthorizedException('User not found');
    }

    if (!userWithVerification.emailVerifiedAt) {
      console.log('email not verified');
      throw new UnauthorizedException({
        success: false,
        message: 'Your email has not been confirmed yet.',
      });
    }

    return true;
  }
}
