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
  ValidationPipe,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiBody, ApiResponse, ApiTags } from '@nestjs/swagger';

import { NullOrUndefinedResultInterceptor } from '@energyweb/origin-backend-utils';
import { UpdateUserDTO } from './dto/update-user.dto';
import { UserDTO } from '../user/dto/user.dto';

import { UserService } from '../user/user.service';
import { ActiveUserGuard, RolesGuard } from '../../guards';
import { Role } from '../../utils/enums';
import { Roles } from '../user/decorators/roles.decorator';
import { UserFilterDTO } from './dto/user-filter.dto';

@ApiTags('admin')
@ApiBearerAuth('access-token')
@Controller('admin')
@UseInterceptors(NullOrUndefinedResultInterceptor)
export class AdminController {
  constructor(private readonly userService: UserService) {}

  @Get('users')
  @UseGuards(AuthGuard('jwt'), ActiveUserGuard, RolesGuard)
  @Roles(Role.Admin, Role.SupportAgent)
  @ApiResponse({
    status: HttpStatus.OK,
    type: [UserDTO],
    description: 'Gets all users',
  })
  public async getUsers(
    @Query(ValidationPipe) filterDto: UserFilterDTO,
  ): Promise<UserDTO[]> {
    return this.userService.getUsersByFilter(filterDto);
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
