import { IUser } from '../models';
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Inject,
  Logger,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { UserService } from '../pods/user/user.service';
import { Role } from '../utils/enums';
import { EmailConfirmationService } from '../pods/email-confirmation/email-confirmation.service';
import { OauthClientCredentialsService } from '../pods/user/oauth_client.service';
import { isEmail } from 'class-validator';
import { UrlPath } from '../utils/enums/url-path.enum';
import { OrganizationType } from '../utils/enums/organization-type.enum';

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
    const request = context.switchToHttp().getRequest();
    const pathSegment = request.url.split('/')[3];
    let user: IUser;

    switch (pathSegment) {
      case UrlPath.ForgetPassword:
        user = await this.userService.findByEmail(request.body.email);
        if (!user) {
          throw new NotFoundException(`No user found with that email address`);
        }
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
        const userRoles = [OrganizationType.Developer, OrganizationType.ApiUser, OrganizationType.Buyer];

        if (userRoles.includes(request.body.organizationType)) {
          user = userData;
        } else if (
          request.body.api_user_id !== userData.api_user_id &&
          (request.body.organizationType === OrganizationType.Developer ||
            request.body.organizationType === OrganizationType.Buyer)
        ) {
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
        } else if (request.body.organizationType === Role.ApiUser) {
          const apiUser =
            await this.oauthClientCredentialsService.createAPIUser();
          request.body.api_user_id = apiUser.api_user_id;
        }
        break;
      }

      case UrlPath.ExportAccessKey:
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

    const adminApiUserId = (
      (await this.userService.findOne({ role: Role.Admin })) as IUser
    ).api_user_id;

    if (
      request.body.organizationType === undefined &&
      user.role != Role.Admin &&
      user.role != Role.ApiUser &&
      user.api_user_id != adminApiUserId
    ) {
      throw new UnauthorizedException({
        statusCode: 401,
        message: 'Unauthorized',
      });
    }
    request.user = user;
    return true;
  }
}
