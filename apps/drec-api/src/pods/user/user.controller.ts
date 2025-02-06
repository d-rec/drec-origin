import { NullOrUndefinedResultInterceptor } from '@energyweb/origin-backend-utils';
import {
  ClassSerializerInterceptor,
  Controller,
  Get,
  Req,
  Post,
  Body,
  Put,
  Param,
  ParseIntPipe,
  HttpStatus,
  UseGuards,
  UseInterceptors,
  ConflictException,
  Res,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiResponse,
  ApiBody,
  ApiTags,
  ApiUnprocessableEntityResponse,
  ApiParam,
} from '@nestjs/swagger';
import { UserDecorator } from './decorators/user.decorator';
import { UserDTO } from './dto/user.dto';
import { UserService } from './user.service';
import { CreateUserOrgDTO } from './dto/create-user.dto';
import { IEmailConfirmationToken, ILoggedInUser } from '../../models';
import {
  ActiveUserGuard,
  PermissionGuard,
  RolesGuard,
  WithoutAuthGuard,
} from '../../guards';
import { UpdateUserProfileDTO } from './dto/update-user-profile.dto';
import {
  UpdatePasswordDTO,
  UpdateChangePasswordDTO,
  ForgetPasswordDTO,
} from './dto/update-password.dto';
import {
  EmailConfirmationService,
  SuccessResponse,
} from '../email-confirmation/email-confirmation.service';
import { SuccessResponseDTO } from '@energyweb/origin-backend-utils';
import { Request, Response } from 'express';
import { OauthClientCredentialsService } from './oauth_client.service';
import { Permission } from '../permission/decorators/permission.decorator';
import { ACLModules } from '../access-control-layer-module-service/decorator/aclModule.decorator';
import { Roles } from './decorators/roles.decorator';
import { Role } from '../../utils/enums';
import { isEmail } from 'class-validator';

@ApiTags('user')
@ApiBearerAuth('access-token')
@UseInterceptors(ClassSerializerInterceptor, NullOrUndefinedResultInterceptor)
@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly emailConfirmationService: EmailConfirmationService,
    private readonly oauthClientService: OauthClientCredentialsService,
  ) {}

  /**
   * This api route use for get user information
   * @param param0
   * @returns {UserDTO}
   */
  @Get('me')
  @UseGuards(AuthGuard(['jwt', 'oauth2-client-password'])) /*,PermissionGuard)
  @Permission('Read')
  @ACLModules('USER_MANAGEMENT_CRUDL') */
  @ApiResponse({
    status: HttpStatus.OK,
    type: UserDTO,
    description: 'Get my user profile',
  })
  me(@UserDecorator() { id }: UserDTO): Promise<UserDTO | null> {
    return this.userService.findById(id);
  }
  /**
   * This api user for get the user info by user id
   * @param id
   * @param loggedUser
   * @returns {UserDTO}
   */
  @Get(':id')
  @UseGuards(
    AuthGuard(['jwt', 'oauth2-client-password']),
    ActiveUserGuard,
    PermissionGuard,
  )
  @Permission('Read')
  @ACLModules('USER_MANAGEMENT_CRUDL')
  @ApiResponse({
    status: HttpStatus.OK,
    type: UserDTO,
    description: `Get another user's data`,
  })
  public async get(
    @Param('id', new ParseIntPipe()) id: number,
    @UserDecorator() loggedUser: ILoggedInUser,
  ): Promise<UserDTO | null> {
    return await this.userService.canViewUserData(id, loggedUser);
  }

  /**
   * add new for adding user with organization
   * @body {CreateUserORGDTO}
   * @returns {UserDTO}
   */
  @Post('register')
  @ApiBody({ type: CreateUserOrgDTO })
  @UseGuards(WithoutAuthGuard, PermissionGuard)
  @Permission('Write')
  @ACLModules('USER_MANAGEMENT_CRUDL')
  @ApiResponse({
    status: HttpStatus.CREATED,
    type: UserDTO,
    description: 'Register a new user ',
  })
  public async register(
    @Body() userRegistrationData: CreateUserOrgDTO,
    @Req() request: Request,
  ): Promise<UserDTO> {
    const user = request.user;
    if (!userRegistrationData.api_user_id) {
      userRegistrationData.api_user_id = (user as any).api_user_id;
    }
    return this.userService.newCreateUser(userRegistrationData);
  }
  /**
   * this api route using for update Profile.
   * @body { 'firstName':string,'lastName':string,'email':string}.
   * @returns {UserDTO} .
   */
  @Put('profile')
  @UseGuards(
    AuthGuard(['jwt', 'oauth2-client-password']),
    ActiveUserGuard,
    PermissionGuard,
  )
  @Permission('Write')
  @ACLModules('USER_MANAGEMENT_CRUDL')
  @ApiBody({ type: UpdateUserProfileDTO })
  @ApiResponse({
    status: HttpStatus.OK,
    type: UserDTO,
    description: `Update your own profile`,
  })
  @ApiUnprocessableEntityResponse({
    description: 'Input data validation failed',
  })
  public async updateOwnProfile(
    @UserDecorator() { id }: ILoggedInUser,
    @Body() dto: UpdateUserProfileDTO,
  ): Promise<UserDTO> {
    return this.userService.updateProfile(id, dto);
  }
  /**
   * this api route using for update password
   * @returns {UserDTO} .
   */
  @Put('password')
  @UseGuards(
    AuthGuard(['jwt', 'oauth2-client-password']),
    ActiveUserGuard,
    PermissionGuard,
  )
  @Permission('Write')
  @ACLModules('USER_MANAGEMENT_CRUDL')
  @ApiBody({ type: UpdatePasswordDTO })
  @ApiResponse({
    status: HttpStatus.OK,
    type: UserDTO,
    description: `Update your own password`,
  })
  public async updateOwnPassword(
    @UserDecorator() { email }: ILoggedInUser,
    @Body() body: UpdatePasswordDTO,
  ): Promise<UserDTO> {
    return this.userService.updatePassword(email, body);
  }
  /**
   * This api route to update the password by validating token .
   * @returns {UserDTO} .
   */
  @Put('reset/password/:token')
  @UseGuards(WithoutAuthGuard, PermissionGuard)
  //@UseGuards(PermissionGuard)
  @Permission('Write')
  @ACLModules('PASSWORD_MANAGEMENT_CRUDL')
  @ApiBody({ type: UpdateChangePasswordDTO })
  @ApiResponse({
    status: HttpStatus.OK,
    type: UserDTO,
    description: `Update your own password`,
  })
  @ApiParam({ name: 'token', type: String })
  public async changePassword(
    @Param('token') token: IEmailConfirmationToken['token'],
    @Body() body: UpdateChangePasswordDTO,
  ): Promise<UserDTO> {
    if (isEmail(token)) {
      console.log('Token Email', token);
      const emailConfirmation = await this.userService.findOne({
        email: token,
      });
      return this.userService.changePassword(emailConfirmation, body);
    }
    console.log('Token Not Email', token);
    const emailConfirmation = await this.emailConfirmationService.findOne({
      token,
    });
    if (!emailConfirmation) {
      throw new ConflictException({
        success: false,
        errors: `User Not exist .`,
      });
    }
    return this.userService.changePassword(emailConfirmation.user, body);
  }
  /**
   * this api route use for confirm user email from email click in register time
   * @param token :stirng
   * @returns {EmailConfirmationResponse}:"Email confirmed successfully"
   */
  @Put('confirm-email/:token')
  @UseGuards(WithoutAuthGuard, PermissionGuard)
  //@UseGuards(PermissionGuard)
  @Permission('Write')
  @ACLModules('USER_MANAGEMENT_CRUDL')
  @ApiResponse({
    status: HttpStatus.OK,
    type: String,
    description: `Confirm an email confirmation token`,
  })
  @ApiParam({ name: 'token', type: String })
  public async confirmToken(
    @Param('token') token: IEmailConfirmationToken['token'],
  ): Promise<SuccessResponse> {
    return this.emailConfirmationService.confirmEmail(token);
  }

  /**
   * This api route use for resend confirm email after login if user not confirm email at register time
   * @param param0
   * @returns
   */
  @Put('resend-confirm-email')
  @UseGuards(AuthGuard(['jwt', 'oauth2-client-password']), PermissionGuard)
  @Permission('Write')
  @ACLModules('USER_MANAGEMENT_CRUDL')
  @ApiResponse({
    status: HttpStatus.OK,
    type: SuccessResponseDTO,
    description: `Resend a confirmation email`,
  })
  public async reSendEmailConfirmation(
    @UserDecorator() { email }: ILoggedInUser,
  ): Promise<SuccessResponseDTO> {
    return this.emailConfirmationService.sendConfirmationEmail(email);
  }

  /**
   * This api route use for if user forget password and want to change password
   * @param req
   * @param body
   * @returns {SuccessResponseDTO}
   */
  @Post('forget-password')
  @UseGuards(WithoutAuthGuard, PermissionGuard)
  /*@UseGuards(PermissionGuard) */
  @Permission('Write')
  @ACLModules('PASSWORD_MANAGEMENT_CRUDL')
  @ApiResponse({
    status: HttpStatus.OK,
    type: SuccessResponseDTO,
    description: `send a email`,
  })
  public async forgetPassword(
    @Req() req: Request,
    @Body() body: ForgetPasswordDTO,
  ): Promise<SuccessResponseDTO> {
    return this.userService.getTokenForResetPassword(body.email);
  }

  @Get('export-accesskey/:api_user_id')
  @UseGuards(WithoutAuthGuard, RolesGuard)
  @Roles(Role.ApiUser)
  public async accessKeyFile(
    @Param('api_user_id') api_user_id: string,
    @Res() res: Response,
  ): Promise<any> {
    return await this.oauthClientService.createKeyFile(api_user_id, res);
  }
}
