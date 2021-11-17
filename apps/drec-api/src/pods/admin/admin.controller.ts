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
  Delete,
  NotFoundException,
  Patch,
  Post,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiBody,
  ApiNotFoundResponse,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import {
  NullOrUndefinedResultInterceptor,
  SuccessResponseDTO,
} from '@energyweb/origin-backend-utils';
import { UpdateUserDTO } from './dto/update-user.dto';
import { UserDTO } from '../user/dto/user.dto';

import { UserService } from '../user/user.service';
import { ActiveUserGuard, RolesGuard } from '../../guards';
import { OrganizationService } from '../organization/organization.service';
import { Role } from '../../utils/enums';
import { Roles } from '../user/decorators/roles.decorator';
import { UserFilterDTO } from './dto/user-filter.dto';
import { OrganizationDTO, UpdateOrganizationDTO } from '../organization/dto';
import { ResponseSuccess } from '../../models';
import { CreateUserDTO } from '../user/dto/create-user.dto';

@ApiTags('admin')
@ApiBearerAuth('access-token')
@Controller('admin')
@UseGuards(AuthGuard('jwt'), ActiveUserGuard, RolesGuard)
@UseInterceptors(NullOrUndefinedResultInterceptor)
export class AdminController {
  constructor(
    private readonly userService: UserService,
    private readonly organizationService: OrganizationService,
  ) {}

  @Get('/users')
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

  @Get('/organizations')
  @Roles(Role.Admin, Role.SupportAgent)
  @ApiResponse({
    type: [OrganizationDTO],
    description: 'Returns all Organizations',
  })
  async getAllOrganizations(): Promise<OrganizationDTO[]> {
    return await this.organizationService.getAll();
  }

  @Get('/organizations/:id')
  @Roles(Role.Admin, Role.SupportAgent)
  @ApiResponse({
    status: HttpStatus.OK,
    type: OrganizationDTO,
    description: 'Gets an organization',
  })
  @ApiNotFoundResponse({
    description: `The organization with the id doesn't exist`,
  })
  async getOrganizationById(
    @Param('id', new ParseIntPipe()) organizationId: number,
  ): Promise<OrganizationDTO | undefined> {
    return this.organizationService.findOne(organizationId);
  }

  @Post('/users')
  @Roles(Role.Admin)
  @ApiResponse({
    status: HttpStatus.OK,
    type: CreateUserDTO,
    description: 'Returns a new created user',
  })
  public async createUser(@Body() newUser: CreateUserDTO): Promise<UserDTO> {
    return await this.userService.create(newUser);
  }

  @Put('/users/:id')
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

  @Patch('/organizations/:id')
  @Roles(Role.Admin)
  @ApiResponse({
    status: HttpStatus.OK,
    type: UpdateOrganizationDTO,
    description: 'Returns an updated Organization',
  })
  @ApiNotFoundResponse({ description: `No organization found` })
  public async updateOrganization(
    @Param('id') organizationId: number,
    @Body() organizationToUpdate: UpdateOrganizationDTO,
  ): Promise<OrganizationDTO> {
    return await this.organizationService.update(
      organizationId,
      organizationToUpdate,
    );
  }

  @Delete('/organizations/:id')
  @Roles(Role.Admin)
  @ApiResponse({
    status: HttpStatus.OK,
    type: SuccessResponseDTO,
    description: 'Delete an organization',
  })
  async deleteOrganization(
    @Param('id', new ParseIntPipe()) organizationId: number,
  ): Promise<SuccessResponseDTO> {
    const organization = await this.organizationService.findOne(organizationId);

    if (!organization) {
      throw new NotFoundException('Does not exist');
    }

    await this.organizationService.remove(organizationId);

    return ResponseSuccess();
  }
}
