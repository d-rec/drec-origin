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
  ApiOperation,
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

@ApiTags('User')
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
  @ApiOperation({
    summary: 'Get Current User Profile',
    description:
      'Retrieves the profile of the currently authenticated user, including user details such as ID, first name, last name, email, and any other relevant user information.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: UserDTO,
    description: 'Returns a UserDTO object containing user details.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description:
      'Unauthorized access. The user must be authenticated to access this endpoint.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description:
      'Forbidden. The user does not have permission to access this resource.',
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
  @ApiOperation({
    summary: 'Get User by ID',
    description:
      'Fetches user information based on the provided user ID. Ensures that the requester has the necessary permissions to view the user data.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: UserDTO,
    description:
      "Returns a UserDTO object containing the requested user's details, including ID, first name, last name, email, and any other relevant information.",
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description:
      'User not found. The specified user ID does not correspond to any existing user.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description:
      'Unauthorized access. The user must be authenticated to access this endpoint.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description:
      'Forbidden. The user does not have permission to access this resource.',
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
  @ApiOperation({
    summary: 'Register a New User',
    description:
      "Creates a new user account with the provided registration data. The request body must include the user's organization details, as they are required for registration.",
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    type: UserDTO,
    description:
      "Returns the newly created UserDTO object containing the user's details, including ID, first name, last name, email, and any other relevant information.",
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description:
      'Bad Request. The provided registration data is invalid or missing required fields.',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Conflict. A user with the provided email already exists.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description:
      'Unauthorized access. The user must be authenticated to access this endpoint.',
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
  @ApiOperation({
    summary: 'Update User Profile',
    description:
      'Updates the profile information of the authenticated user. The request body must include the updated user details such as first name, last name, and email.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: UserDTO,
    description:
      "Returns the updated UserDTO object containing the user's details after the profile update.",
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description:
      'Unauthorized access. The user must be authenticated to access this endpoint.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description:
      'Forbidden. The user does not have permission to update this resource.',
  })
  @ApiUnprocessableEntityResponse({
    description:
      'Input data validation failed. The provided data does not meet the required format or constraints.',
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
  @ApiOperation({
    summary: 'Update Your Own Password',
    description:
      'Allows the authenticated user to change their password. The request body must include the current password and the new password.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: UserDTO,
    description:
      "Returns the updated UserDTO object containing the user's details after the password update.",
  })
  @ApiUnprocessableEntityResponse({
    description:
      'Input data validation failed. The provided data does not meet the required format or constraints.',
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
  @ApiOperation({
    summary: 'Reset Password Using Token',
    description: 'Allows users to reset their password using a valid token.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: UserDTO,
    description:
      "Returns the updated UserDTO object containing the user's details after the password reset.",
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Conflict. The token is invalid.',
  })
  @ApiParam({ name: 'token', type: String })
  public async changePassword(
    @Param('token') token: IEmailConfirmationToken['token'],
    @Body() body: UpdateChangePasswordDTO,
  ): Promise<UserDTO> {
    if (isEmail(token)) {
      const emailConfirmation = await this.userService.findOne({
        email: token,
      });
      return this.userService.changePassword(emailConfirmation, body);
    }
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
  @ApiOperation({
    summary: 'Confirm Email Address',
    description:
      'Confirms a user’s email address using a token sent during registration. This is necessary for verifying the user’s email.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: String,
    description:
      'Returns a success message indicating that the email has been confirmed successfully.',
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
  @ApiOperation({
    summary: 'Resend Confirmation Email',
    description:
      'Resends the email confirmation link to the authenticated user if they did not confirm their email.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: SuccessResponseDTO,
    description:
      'Returns a success message indicating that the confirmation email has been resent.',
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
  @ApiOperation({
    summary: 'Request Password Reset',
    description:
      'Initiates the password recovery process by sending a reset token to the user’s email address.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: SuccessResponseDTO,
    description:
      'Returns a success message indicating that the reset email has been sent.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description:
      'Bad Request. The provided email is invalid or not associated with any user.',
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
  @ApiOperation({
    summary: 'Export Access Key',
    description:
      'Generates and exports an access key file for the specified API user ID.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns the access key file for the specified API user ID.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description:
      'User not found. The specified API user ID does not correspond to any existing user.',
  })
  public async accessKeyFile(
    @Param('api_user_id') api_user_id: string,
    @Res() res: Response,
  ): Promise<any> {
    return await this.oauthClientService.createKeyFile(api_user_id, res);
  }
}
