import { IUser } from '../models';
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Inject,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { UserService } from '../pods/user/user.service';
import { Role } from '../utils/enums';
import { EmailConfirmationService } from '../pods/email-confirmation/email-confirmation.service';
import { OauthClientCredentialsService } from '../pods/user/oauth_client.service';
@Injectable()
export class WithoutAuthGuard implements CanActivate {
  private readonly logger = new Logger(WithoutAuthGuard.name);

  constructor(
    @Inject(UserService)
    private readonly userService: UserService,
    @Inject(EmailConfirmationService)
    private readonly emailConfirmationService: EmailConfirmationService,
    @Inject(OauthClientCredentialsService)
    private readonly oauthClientCredentialsService: OauthClientCredentialsService,
  ) {}

  async canActivate(context: ExecutionContext) {
    this.logger.verbose(`With in canActivate`);

    const request = context.switchToHttp().getRequest();
    let user: IUser;

    if (request.url.split('/')[3] === 'forget-password') {
      user = await this.userService.findByEmail(request.body.email);
    } else if (
      request.url.split('/')[3] === 'confirm-email' ||
      request.url.split('/')[3] === 'reset'
    ) {
      user = (
        await this.emailConfirmationService.findOne({
          token: request.params.token,
        })
      ).user;
    } else if (request.url.split('/')[3] === 'register') {
      const userData = await this.userService.findOne({ role: Role.Admin });
      if (
        !request.body.api_user_id &&
        (request.body.organizationType === 'Developer' ||
          request.body.organizationType === Role.Buyer)
      ) {
        user = userData;
      } else if (
        request.body.api_user_id &&
        request.body.api_user_id != user.api_user_id &&
        (request.body.organizationType === 'Developer' ||
          request.body.organizationType === Role.Buyer)
      ) {
        user = await this.userService.findOne({
          role: Role.ApiUser,
          api_user_id: request.body.api_user_id,
        });
        if (!user) {
          throw new UnauthorizedException({
            statusCode: 401,
            message: 'Requested apiuser is not available',
          });
        }
      } else if (request.body.organizationType === Role.ApiUser) {
        const api_user =
          await this.oauthClientCredentialsService.createAPIUser();
        request.body.api_user_id = api_user.api_user_id;
      }
    } else if (request.url.split('/')[3] === 'export-accesskey') {
      user = await this.userService.findOne({
        role: Role.ApiUser,
        api_user_id: request.params.api_user_id,
      });
    }

    if (
      request.body.organizationType === undefined &&
      user.role != Role.Admin &&
      user.role != Role.ApiUser &&
      user.api_user_id !=
        ((await this.userService.findOne({ role: Role.Admin })) as IUser)
          .api_user_id
    ) {
      throw new UnauthorizedException({
        statusCode: 401,
        message: 'Unauthorized',
      });
      //return false;
    }

    request.user = user;
    return true;
  }
}
