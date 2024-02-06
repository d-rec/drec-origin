import { IUser, LoggedInUser } from '../models';
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Inject,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserService } from '../pods/user/user.service';
import { Role } from '../utils/enums';
import { EmailConfirmationService } from 'src/pods/email-confirmation/email-confirmation.service';
@Injectable()
export class WithoutAuthGuard implements CanActivate {

  private readonly logger = new Logger(WithoutAuthGuard.name);

  constructor(
    @Inject(UserService)
    private readonly userService : UserService,
    @Inject(EmailConfirmationService)
    private readonly emailConfirmationService: EmailConfirmationService,
  ) {}

  async canActivate(context: ExecutionContext) {
    this.logger.verbose(`With in canActivate`);

    const request = context.switchToHttp().getRequest();
    let user: IUser;

    if(request.url.split('/')[3] === 'forget-password') {
      user = await this.userService.findByEmail(request.body.email);
    }
    else if(request.url.split('/')[3] === 'confirm-email' || request.url.split('/')[3] === 'reset') {
      user = (await this.emailConfirmationService.findOne({token : request.params.token})).user;
    }

    //@ts-ignore
    if(user.role != Role.Admin && user.role != Role.ApiUser  && (user.api_user_id != (await this.userService.findOne({role:Role.Admin}) as IUser).api_user_id)) {
      throw new UnauthorizedException({statusCode: 401, message: "Unauthorized"});
      //return false;
    }
    
    request.user = user;
    return true;
  }
}
