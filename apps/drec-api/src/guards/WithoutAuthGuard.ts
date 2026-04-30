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
    const user = await this.resolveUser(request, pathSegment);

    this.enforceRoleCheck(request, pathSegment, user);
    request.user = user;
    return true;
  }

  private async resolveUser(request: any, pathSegment: string): Promise<IUser> {
    switch (pathSegment) {
      case UrlPath.ForgetPassword:
        return this.resolveForgetPasswordUser(request);
      case UrlPath.ResetPassword:
        return this.resolveResetPasswordUser(request);
      case UrlPath.Register:
        return this.resolveRegisterUser(request);
      case UrlPath.ExportAccessKey:
        return this.userService.findOne({
          role: Role.Registrant,
          api_user_id: request.params.api_user_id,
        });
      case UrlPath.Login:
        return this.userService.findByEmail(request.body.username);
      default:
        return undefined;
    }
  }

  private async resolveForgetPasswordUser(request: any): Promise<IUser> {
    const user = await this.userService.findByEmail(request.body.email);
    if (!user) {
      throw new NotFoundException(`No user found with that email address`);
    }
    return user;
  }

  private async resolveResetPasswordUser(request: any): Promise<IUser> {
    if (isEmail(request.params.token)) {
      this.logger.verbose(`Token is an email: ${request.params.token}`);
      return this.userService.findByEmail(request.params.token);
    }
    return (
      await this.emailConfirmationService.findOne({
        token: request.params.token,
      })
    ).user;
  }

  private async resolveRegisterUser(request: any): Promise<IUser> {
    const adminUser = await this.userService.findOne({ role: Role.Admin });
    const isBuyer = request.body.organizationType === OrganizationType.Buyer;
    const isSiteOperator =
      request.body.organizationType === OrganizationType.SiteOperator;

    if ((isBuyer || isSiteOperator) && !request.body.api_user_id) {
      return adminUser;
    }

    if (
      request.body.api_user_id &&
      request.body.api_user_id !== adminUser.api_user_id &&
      (isBuyer || isSiteOperator)
    ) {
      const user = await this.userService.findOne({
        role: Role.Registrant,
        api_user_id: request.body.api_user_id,
      });
      if (!user) {
        throw new UnauthorizedException({
          statusCode: 401,
          message: 'Requested api user is not available',
        });
      }
      return user;
    }

    if (request.body.organizationType === OrganizationType.Registrant) {
      const registrant =
        await this.oauthClientCredentialsService.createRegistrant();
      request.body.api_user_id = registrant.api_user_id;
    }

    return undefined;
  }

  private async enforceRoleCheck(
    request: any,
    pathSegment: string,
    user: IUser,
  ): Promise<void> {
    const skipRoleCheck =
      pathSegment === UrlPath.ResetPassword || pathSegment === UrlPath.Login;

    if (skipRoleCheck || request.body.organizationType !== undefined) {
      return;
    }

    const adminApiUserId = (
      (await this.userService.findOne({ role: Role.Admin })) as IUser
    ).api_user_id;

    if (
      user.role != Role.Admin &&
      user.role != Role.Registrant &&
      user.api_user_id != adminApiUserId
    ) {
      throw new UnauthorizedException({
        statusCode: 401,
        message: 'Unauthorized',
      });
    }
  }
}
