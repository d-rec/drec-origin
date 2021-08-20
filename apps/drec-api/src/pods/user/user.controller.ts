import { NullOrUndefinedResultInterceptor } from '@energyweb/origin-backend-utils';
import {
  ClassSerializerInterceptor,
  Controller,
  Get,
  Post,
  Body,
  HttpStatus,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RolesGuard } from '../../auth/roles-guard';
import { UserDecorator } from './decorators/user.decorator';
import { UserDTO } from './dto/user.dto';
import { UserService } from './user.service';
import { CreateUserDTO } from './dto/create-user.dto';

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

  @Post()
  @UseGuards(RolesGuard)
  @ApiResponse({
    status: HttpStatus.OK,
    type: CreateUserDTO,
    description: 'Returns a new created user',
  })
  public async create(@Body() newUser: CreateUserDTO): Promise<UserDTO | null> {
    return await this.userService.create(newUser);
  }
}
