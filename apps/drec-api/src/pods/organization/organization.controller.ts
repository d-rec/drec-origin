import { NullOrUndefinedResultInterceptor } from '@energyweb/origin-backend-utils';
import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  HttpStatus,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  ForbiddenException,
  ParseIntPipe,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiResponse,
  ApiSecurity,
  ApiNotFoundResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

import {
  OrganizationDTO,
  NewOrganizationDTO,
  UpdateOrganizationDTO,
} from './dto';
import { OrganizationService } from './organization.service';
import { UserDTO } from '../user/dto/user.dto';
import { UserDecorator } from '../user/decorators/user.decorator';
import { RolesGuard } from '../../guards/RolesGuard';
import { Role } from '../../utils/enums/role.enum';
import { Roles } from '../user/decorators/roles.decorator';
import { ILoggedInUser, isRole, ResponseSuccess } from '../../models';
import { ActiveUserGuard } from '../../guards';
import { SuccessResponseDTO } from '@energyweb/origin-backend-utils';

@ApiTags('organization')
@ApiBearerAuth('access-token')
@ApiSecurity('drec')
@Controller('/Organization')
@UseGuards(AuthGuard('jwt'))
@UseInterceptors(NullOrUndefinedResultInterceptor)
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles(Role.Admin)
  @ApiResponse({
    type: [OrganizationDTO],
    description: 'Returns all Organizations',
  })
  async getAll(): Promise<OrganizationDTO[]> {
    return await this.organizationService.getAll();
  }

  @Get('/me')
  @ApiResponse({
    status: HttpStatus.OK,
    type: OrganizationDTO,
    description: 'Gets user`s organization',
  })
  async getOrganizationById(
    @UserDecorator() { organizationId }: ILoggedInUser,
  ): Promise<OrganizationDTO | undefined> {
    return await this.organizationService.findOne(organizationId);
  }

  @Get('/users')
  @ApiResponse({
    status: HttpStatus.OK,
    type: [UserDTO],
    description: 'Gets organization`s users',
  })
  @ApiNotFoundResponse({
    description: `There are no users associated to this organization`,
  })
  async getOrganizationUsersByCode(
    @UserDecorator() { organizationId }: ILoggedInUser,
  ): Promise<UserDTO[]> {
    return this.organizationService.findOrganizationUsers(organizationId);
  }

  @Get('/:id')
  @ApiResponse({
    status: HttpStatus.OK,
    type: OrganizationDTO,
    description: 'Gets an organization',
  })
  @ApiNotFoundResponse({
    description: `The organization with the id doesn't exist`,
  })
  async get(
    @Param('id', new ParseIntPipe()) organizationId: number,
    @UserDecorator() loggedUser: ILoggedInUser,
  ): Promise<OrganizationDTO | undefined> {
    this.ensureOrganizationMemberOrAdmin(loggedUser, organizationId);
    return this.organizationService.findOne(organizationId);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.Admin)
  @ApiResponse({
    status: HttpStatus.OK,
    type: OrganizationDTO,
    description: 'Returns a new created Organization',
  })
  public async register(
    @Body() organizationToRegister: NewOrganizationDTO,
    @UserDecorator() loggedUser: ILoggedInUser,
  ): Promise<OrganizationDTO> {
    return await this.organizationService.create(
      organizationToRegister,
      loggedUser,
    );
  }

  @Patch('/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.Admin)
  @ApiResponse({
    status: HttpStatus.OK,
    type: UpdateOrganizationDTO,
    description: 'Returns an updated Organization',
  })
  @ApiNotFoundResponse({ description: `No organization found` })
  public async update(
    @Param('id') organizationId: number,
    @Body() organizationToUpdate: UpdateOrganizationDTO,
  ): Promise<OrganizationDTO> {
    return await this.organizationService.update(
      organizationId,
      organizationToUpdate,
    );
  }

  @Delete('/:id')
  @UseGuards(AuthGuard(), ActiveUserGuard, RolesGuard)
  @Roles(Role.Admin)
  @ApiResponse({
    status: HttpStatus.OK,
    type: SuccessResponseDTO,
    description: 'Delete an organization',
  })
  async delete(
    @Param('id', new ParseIntPipe()) organizationId: number,
  ): Promise<SuccessResponseDTO> {
    const organization = await this.organizationService.findOne(organizationId);

    if (!organization) {
      throw new NotFoundException('Does not exist');
    }

    await this.organizationService.remove(organizationId);

    return ResponseSuccess();
  }

  private ensureOrganizationMemberOrAdmin(
    user: ILoggedInUser,
    organizationId: number,
  ) {
    const isOrganizationMember = user.organizationId === organizationId;
    const hasAdminRole = isRole(user.role, Role.Admin);

    if (hasAdminRole) {
      return;
    }
    if (!isOrganizationMember) {
      throw new ForbiddenException('Not a member of the organization.');
    }
  }
}
