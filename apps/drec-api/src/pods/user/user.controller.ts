import { NullOrUndefinedResultInterceptor } from '@energyweb/origin-backend-utils';
import {
  ClassSerializerInterceptor,
  BadRequestException,
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
  UnauthorizedException
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
import { EmailConfirmationResponse } from '../../utils/enums';
import { IEmailConfirmationToken, ILoggedInUser } from '../../models';
import { UpdateOwnUserSettingsDTO } from './dto/update-own-user-settings.dto';
import { ActiveUserGuard } from '../../guards';
import { UpdateUserProfileDTO } from './dto/update-user-profile.dto';
import { UpdatePasswordDTO, UpdateChangePasswordDTO } from './dto/update-password.dto';
import { EmailConfirmationService } from '../email-confirmation/email-confirmation.service';
import { SuccessResponseDTO } from '@energyweb/origin-backend-utils';

import { Request } from 'express';

@ApiTags('user')
@ApiBearerAuth('access-token')
@UseInterceptors(ClassSerializerInterceptor, NullOrUndefinedResultInterceptor)
@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly emailConfirmationService: EmailConfirmationService,
  ) { }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  @ApiResponse({
    status: HttpStatus.OK,
    type: UserDTO,
    description: 'Get my user profile',
  })
  me(@UserDecorator() { id }: UserDTO): Promise<UserDTO | null> {
    return this.userService.findById(id);
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'), ActiveUserGuard)
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

  // @Post('register')
  // @ApiBody({ type: CreateUserDTO })
  // @ApiResponse({
  //   status: HttpStatus.CREATED,
  //   type: UserDTO,
  //   description: 'Register a user',
  // })
  // public async register(
  //   @Body() userRegistrationData: CreateUserDTO,
  // ): Promise<UserDTO> {
  //   return this.userService.create(userRegistrationData);
  // }
  // add new for adding user with organization
  @Post('register')
  @ApiBody({ type: CreateUserORGDTO })
  @ApiResponse({
    status: HttpStatus.CREATED,
    type: UserDTO,
    description: 'Register a user',
  })
  public async register(
    @Body() userRegistrationData: CreateUserORGDTO,
  ): Promise<UserDTO> {
    console.log(userRegistrationData);
    if (userRegistrationData.organizationType === '' || userRegistrationData.organizationType === null || userRegistrationData.organizationType === undefined) {
      return new Promise((resolve, reject) => {
        reject(
          new ConflictException({
            success: false,
            message: `organizationType should not be empty`,
          })
        );
      });
    }

    if (userRegistrationData.organizationType != "Buyer" && userRegistrationData.organizationType != "Developer") {
      return new Promise((resolve, reject) => {
        reject(
          new ConflictException({
            success: false,
            message: `organizationType value should be Developer/Buyer`,
          })
        );
      });
    }
    if (userRegistrationData.orgName.trim() === "") {
      return new Promise((resolve, reject) => {
        reject(
          new ConflictException({
            success: false,
            message: `orgName should not be empty`,
          })
        );
      });
    }
    return this.userService.newcreate(userRegistrationData);
  }

  @Post('registerWithOrganization')
  @ApiBody({ type: CreateUserORGDTO })
  @ApiResponse({
    status: HttpStatus.CREATED,
    type: UserDTO,
    description: 'Register a user',
  })
  public async newregister(
    @Body() userRegistrationData: CreateUserORGDTO,
    @Req() request: Request
  ): Promise<UserDTO> {
    let client;
    if(request.headers['client_id'] && request.headers['client_secret'])
    {
      if(!request.headers['client_secret'] || !request.headers['client_id'])
      {
        throw new UnauthorizedException('Invalid client credentials');
      }
      client= await this.userService.validateClient(request.headers['client_id'], request.headers['client_secret']);
    }
    if(userRegistrationData.organizationType.toLowerCase() != 'ApiUser'.toLowerCase()){
      client= await this.userService.validateClient( process.env.client_id,  process.env.client_secret);

    }
    console.log(userRegistrationData);
    if (userRegistrationData.organizationType === '' || userRegistrationData.organizationType === null || userRegistrationData.organizationType === undefined) {
      return new Promise((resolve, reject) => {
        reject(
          new ConflictException({
            success: false,
            message: `organizationType should not be empty`,
          })
        );
      });
    }

    if (userRegistrationData.organizationType.toLowerCase() != "Buyer".toLowerCase() && userRegistrationData.organizationType.toLowerCase() != "Developer".toLowerCase() && userRegistrationData.organizationType.toLowerCase() != "ApiUser".toLowerCase()) {
      return new Promise((resolve, reject) => {
        reject(
          new ConflictException({
            success: false,
            message: `organizationType value should be Developer/Buyer/ApiUser`,
          })
        );
      });
    }
    if (userRegistrationData.orgName.trim() === "") {
      return new Promise((resolve, reject) => {
        reject(
          new ConflictException({
            success: false,
            message: `orgName should not be empty`,
          })
        );
      });
    }
    if(client)
    {
      console.log("asas",client);
      userRegistrationData['client']=client;
    }
    return this.userService.newcreate(userRegistrationData);
  }

  

  @Put('profile')
  @UseGuards(AuthGuard('jwt'), ActiveUserGuard)
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

  @Put('password')
  @UseGuards(AuthGuard('jwt'), ActiveUserGuard)
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

  @Put('reset/password/:token')
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
    return this.userService.updatechangePassword(token, body);
  }

  @Put('confirm-email/:token')
  @ApiResponse({
    status: HttpStatus.OK,
    type: String,
    description: `Confirm an email confirmation token`,
  })
  @ApiParam({ name: 'token', type: String })
  public async confirmToken(
    @Param('token') token: IEmailConfirmationToken['token'],
  ): Promise<EmailConfirmationResponse> {
    return this.emailConfirmationService.confirmEmail(token);
  }

  @Put('resend-confirm-email')
  @UseGuards(AuthGuard('jwt'))
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
}
