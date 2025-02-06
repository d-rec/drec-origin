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
import { isEmail } from 'class-validator';
import { UrlPath } from '../utils/enums/url-path.enum';

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

  async canActivate(context: ExecutionContext): Promise<boolean> {
    this.logger.verbose(`Within canActivate`);

    const request = context.switchToHttp().getRequest();
    const pathSegment = request.url.split('/')[3];
    let user: IUser;

    switch (pathSegment) {
      case UrlPath.ForgetPassword:
        user = await this.userService.findByEmail(request.body.email);
        break;

      case UrlPath.ConfirmEmail:
      case UrlPath.ResetPassword:
        if (isEmail(request.params.token)) {
          this.logger.verbose(`Token is an email: ${request.params.token}`);
          user = await this.userService.findByEmail(request.params.token);
        } else {
          user = (
            await this.emailConfirmationService.findOne({
              token: request.params.token,
            })
          ).user;
        }
        break;

      case UrlPath.Register: {
        const userData = await this.userService.findOne({ role: Role.Admin });
        const userRoles = [Role.Developer, Role.ApiUser];

        if (!request.body.api_user_id) {
          if (userRoles.includes(request.body.organizationType)) {
            user = userData;
          }
        } else if (request.body.api_user_id !== userData.api_user_id) {
          if (userRoles.includes(request.body.organizationType)) {
            user = await this.userService.findOne({
              role: Role.ApiUser,
              api_user_id: request.body.api_user_id,
            });

            if (!user) {
              throw new UnauthorizedException({
                statusCode: 401,
                message: 'Requested api user is not available',
              });
            }
          }
        } else if (request.body.organizationType === Role.ApiUser) {
          const apiUser =
            await this.oauthClientCredentialsService.createAPIUser();
          request.body.api_user_id = apiUser.api_user_id;
        }
        break;
      }

      case UrlPath.ExportAccesskey:
        user = await this.userService.findOne({
          role: Role.ApiUser,
          api_user_id: request.params.api_user_id,
        });
        break;

      case UrlPath.Login:
        user = await this.userService.findByEmail(request.body.username);
        break;

      default:
        break;
    }

    if (!user) {
      throw new UnauthorizedException({
        statusCode: 401,
        message: 'Unauthorized',
      });
    }

    request.user = user;
    return true;
  }
}
