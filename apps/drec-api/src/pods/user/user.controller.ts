import { NullOrUndefinedResultInterceptor } from '@energyweb/origin-backend-utils';
import {
  ClassSerializerInterceptor,
  BadRequestException,
  Controller,
  Get,
  Req,
  Post,
  Body,
  Query,
  Put,
  Param,
  ParseIntPipe,
  HttpStatus,
  UseGuards,
  UseInterceptors,
  ConflictException,
  UnauthorizedException,
  ValidationPipe,
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
import { CreateUserORGDTO } from './dto/create-user.dto';
import { EmailConfirmationResponse, Role } from '../../utils/enums';
import { IEmailConfirmationToken, ILoggedInUser } from '../../models';
import { UpdateOwnUserSettingsDTO } from './dto/update-own-user-settings.dto';
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
import { EmailConfirmationService } from '../email-confirmation/email-confirmation.service';
import { SuccessResponseDTO } from '@energyweb/origin-backend-utils';
import { EmailConfirmation } from '../email-confirmation/email-confirmation.entity';
import { Permission } from '../permission/decorators/permission.decorator';
import { ACLModules } from '../access-control-layer-module-service/decorator/aclModule.decorator';
import { Request, Response } from 'express';
import { OauthClientCredentialsService } from './oauth_client.service';
import { User } from './user.entity';
import { Roles } from './decorators/roles.decorator';

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
    console.log('With in user me');
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
  @Post('register')
  @ApiBody({ type: CreateUserDTO })
  @ApiResponse({
    status: HttpStatus.CREATED,
    type: UserDTO,
    description: 'Register a user',
  })
  public async register(
    @Body() userRegistrationData: CreateUserDTO,
  ): Promise<UserDTO> {
    return this.userService.create(userRegistrationData);
  }
*/

  /**
   * add new for adding user with organization
   * @body {CreateUserORGDTO}
   * @returns {UserDTO}
   */
  @Post('register')
  @ApiBody({ type: CreateUserORGDTO })
  @UseGuards(WithoutAuthGuard, PermissionGuard)
  @Permission('Write')
  @ACLModules('USER_MANAGEMENT_CRUDL')
  @ApiResponse({
    status: HttpStatus.CREATED,
    type: UserDTO,
    description: 'Register a new user ',
  })
  public async register(
    @Body() userRegistrationData: CreateUserORGDTO,
    @Req() request: Request,
  ): Promise<UserDTO> {
    const user = request.user; /*
    console.log(request.headers);
    if (request.headers['client_id'] && request.headers['client_secret']) {
      if (!request.headers['client_secret'] || !request.headers['client_id']) {
        console.log("When credential not available")
        throw new UnauthorizedException('Invalid client credentials');
      }
      client = await this.userService.validateClient(request.headers['client_id'], request.headers['client_secret']);
    }
    else if (userRegistrationData.organizationType.toLowerCase() != 'ApiUser'.toLowerCase()) {
      client = await this.userService.validateClient(process.env.client_id, process.env.client_secret);

    } */
    if (
      userRegistrationData.organizationType === '' ||
      userRegistrationData.organizationType === null ||
      userRegistrationData.organizationType === undefined
    ) {
      return new Promise((resolve, reject) => {
        reject(
          new ConflictException({
            success: false,
            message: `organizationType should not be empty`,
          }),
        );
      });
    }
    // @ts-ignore
    if (
      userRegistrationData.organizationType.toLowerCase() !=
        'Buyer'.toLowerCase() &&
      userRegistrationData.organizationType.toLowerCase() !=
        'Developer'.toLowerCase() &&
      userRegistrationData.organizationType.toLowerCase() !=
        'ApiUser'.toLowerCase()
    ) {
      return new Promise((resolve, reject) => {
        reject(
          new ConflictException({
            success: false,
            message: `organizationType value should be Developer/Buyer/ApiUser`,
          }),
        );
      });
    }
    if (userRegistrationData.orgName.trim() === '') {
      return new Promise((resolve, reject) => {
        reject(
          new ConflictException({
            success: false,
            message: `orgName should not be empty`,
          }),
        );
      });
    } /*
    if (client) {
      userRegistrationData['client'] = client;
    }  */
    if (!userRegistrationData.api_user_id) {
      // @ts-ignore
      userRegistrationData.api_user_id = user.api_user_id;
    }
    return this.userService.newcreate(userRegistrationData);
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
  public async updatechangePassword(
    @Param('token') token: IEmailConfirmationToken['token'],
    @Body() body: UpdateChangePasswordDTO,
  ): Promise<UserDTO> {
    const emailregex =
      /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    let emailConfirmation: any;
    if (emailregex.test(token)) {
      emailConfirmation = await this.userService.findOne({ email: token });
      return this.userService.updatechangePassword(emailConfirmation, body);
    } else {
      emailConfirmation = await this.emailConfirmationService.findOne({
        token,
      });
      if (!emailConfirmation) {
        throw new ConflictException({
          success: false,
          errors: `User Not exist .`,
        });
      }
      return this.userService.updatechangePassword(
        emailConfirmation.user,
        body,
      );
    }
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
  ) {
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
  public async Forgetpassword(
    @Req() req: Request,
    @Body() body: ForgetPasswordDTO,
  ): Promise<SuccessResponseDTO> {
    /*
    const user = await this.userService.findByEmail(body.email);
    // @ts-ignore
    let client = await this.oauthClientCredentialService.findOneByuserid(user.api_user_id)
    if (req.headers['client_id'] && req.headers['client_secret']) {
      if (!req.headers['client_secret'] || !req.headers['client_id']) {
        console.log("When credential not available")
        throw new UnauthorizedException('Invalid client credentials');
      }
      if (user.role === "ApiUser") {
        client = await this.userService.validateClient(req.headers['client_id'], req.headers['client_secret']);
        console.log("when apiUser", client, user);
      }
      else {
        throw new UnauthorizedException();
      }
    }
    else if (!req.headers || (!req.headers['client_id'] || !req.headers['client_secret'])) {
      if (user.role === "ApiUser") {
        throw new UnauthorizedException({ statusCode: 401, message: "client_id or client_secret missing from headers" });
      }
      if (client.client_id != process.env.client_id) {
        throw new UnauthorizedException();
      } else if (client.client_id === process.env.client_id) {
        client = await this.userService.validateClient(process.env.client_id, process.env.client_secret);
      }
    }

    if (client) {
      console.log("when Client:", client)
      return this.userService.geytokenforResetPassword(body.email);
    } */
    return this.userService.geytokenforResetPassword(body.email);
  }

  @Get('export-accesskey/:api_user_id')
  @UseGuards(WithoutAuthGuard, RolesGuard)
  @Roles(Role.ApiUser)
  public async AccessKeyFile(
    @Param('api_user_id') api_user_id: string,
    @Res() res: Response,
  ) {
    return this.oauthClientService.createKeyFile(api_user_id, res);
  }
}
