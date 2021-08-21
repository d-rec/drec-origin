import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
  Put,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiQuery,
  ApiBearerAuth,
  ApiBody,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { NullOrUndefinedResultInterceptor } from '@energyweb/origin-backend-utils';
import { UpdateUserDTO } from './dto/update-user.dto';
import { UserDTO } from '../user/dto/user.dto';

import { UserService } from '../user/user.service';
import { ActiveUserGuard, RolesGuard } from '../../guards';
import { Role, UserStatus } from '../../utils/enums';
import { Roles } from '../user/decorators/roles.decorator';

@ApiTags('admin')
@ApiBearerAuth('access-token')
@Controller('admin')
@UseInterceptors(NullOrUndefinedResultInterceptor)
export class AdminController {
  constructor(private readonly userService: UserService) {}

  @Get('users')
  @UseGuards(AuthGuard('jwt'), ActiveUserGuard, RolesGuard)
  @Roles(Role.Admin, Role.SupportAgent)
  @ApiQuery({
    name: 'orgName',
    description: 'Filter users by organization name',
    required: false,
    type: String,
  })
  @ApiQuery({
    name: 'status',
    description: 'Filter users by user status',
    required: false,
    enum: UserStatus,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: [UserDTO],
    description: 'Gets all users',
  })
  public async getUsers(
    @Query('orgName') orgName?: string,
    @Query('status') status?: UserStatus,
  ): Promise<UserDTO[]> {
    if (!orgName && !status) {
      return this.userService.getAll({ relations: ['organization'] });
    }

    return this.userService.getUsersBy({
      orgName,
      status,
    });
  }

  @Put('users/:id')
  @UseGuards(AuthGuard('jwt'), ActiveUserGuard, RolesGuard)
  @Roles(Role.Admin, Role.SupportAgent)
  @ApiBody({ type: UpdateUserDTO })
  @ApiResponse({
    status: HttpStatus.OK,
    type: UserDTO,
    description: 'Updates a user (admin)',
  })
  public async updateUser(
    @Param('id', new ParseIntPipe()) id: number,
    @Body() body: UpdateUserDTO,
  ): Promise<UserDTO> {
    return this.userService.update(id, body);
  }
}
