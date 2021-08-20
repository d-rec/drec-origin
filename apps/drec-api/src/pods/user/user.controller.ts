import { NullOrUndefinedResultInterceptor } from '@energyweb/origin-backend-utils';
import {
  ClassSerializerInterceptor,
  BadRequestException,
  Controller,
  Get,
  Post,
  Body,
  Put,
  HttpStatus,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiResponse,
  ApiBody,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { RolesGuard } from '../../guards/RolesGuard';
import { UserDecorator } from './decorators/user.decorator';
import { UserDTO } from './dto/user.dto';
import { UserService } from './user.service';
import { CreateUserDTO } from './dto/create-user.dto';
import { Roles } from './decorators/roles.decorator';
import { Role } from '../../utils/enums';
import { ILoggedInUser } from '../../models';
import { UpdateOwnUserSettingsDTO } from './dto/update-own-user-settings.dto';
import { ActiveUserGuard } from '../../guards';
import { UpdateUserProfileDTO } from './dto/update-user-profile.dto';
import { UpdatePasswordDTO } from './dto/update-password.dto';

@ApiTags('user')
@ApiBearerAuth('access-token')
@UseInterceptors(ClassSerializerInterceptor, NullOrUndefinedResultInterceptor)
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

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

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.Admin)
  @ApiResponse({
    status: HttpStatus.OK,
    type: CreateUserDTO,
    description: 'Returns a new created user',
  })
  public async create(@Body() newUser: CreateUserDTO): Promise<UserDTO> {
    return await this.userService.create(newUser);
  }

  @Put()
  @UseGuards(AuthGuard('jwt'))
  @ApiBody({ type: UpdateOwnUserSettingsDTO })
  @ApiResponse({
    status: HttpStatus.OK,
    type: UserDTO,
    description: `Update you own user settings`,
  })
  public async updateOwnUserSettings(
    @UserDecorator() user: ILoggedInUser,
    @Body() body: UpdateOwnUserSettingsDTO,
  ): Promise<UserDTO | null> {
    try {
      if (typeof body.notifications !== 'undefined') {
        await this.userService.setNotifications(user.id, body.notifications);
      }
      return this.userService.findById(user.id);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
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
}
