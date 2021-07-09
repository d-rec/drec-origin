import { NullOrUndefinedResultInterceptor } from '@energyweb/origin-backend-utils';
import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  HttpStatus,
  Param,
  UseGuards,
  UseInterceptors,
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
import { OrganizationUserDTO } from '../../auth/dto/org-user.dto';
import { RolesGuard } from '../../auth/roles-guard';
import { Role } from '../../utils/eums/role.enum';
import { Roles } from '../user/decorators/roles.decorator';

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
    return this.organizationService.getAll();
  }

  @Get('/me')
  @ApiResponse({
    status: HttpStatus.OK,
    type: OrganizationDTO,
    description: 'Gets user`s organization',
  })
  async getOrganizationByCode(
    @UserDecorator() { organization: { code } }: OrganizationUserDTO,
  ): Promise<OrganizationDTO | null> {
    return this.organizationService.findOne(code);
  }

  @Get('/users')
  @ApiResponse({
    status: HttpStatus.OK,
    type: [UserDTO],
    description: 'Gets organization`s users',
  })
  async getOrganizationUsersByCode(
    @UserDecorator() { organization: { code } }: OrganizationUserDTO,
  ): Promise<UserDTO[]> {
    return this.organizationService.findOrganizationUsers(code);
  }

  @Get('/:code')
  @ApiResponse({
    status: HttpStatus.OK,
    type: OrganizationDTO,
    description: 'Gets an organization',
  })
  async get(
    @Param('code') organizationCode: string,
  ): Promise<OrganizationDTO | null> {
    return this.organizationService.findOne(organizationCode);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.Admin)
  @ApiResponse({
    status: HttpStatus.OK,
    type: OrganizationDTO,
    description: 'Returns a new created Organization',
  })
  public async create(@Body() organizationToRegister: NewOrganizationDTO) {
    return await this.organizationService.create(organizationToRegister);
  }

  @Patch()
  @UseGuards(RolesGuard)
  @Roles(Role.Admin)
  @ApiResponse({
    status: HttpStatus.OK,
    type: UpdateOrganizationDTO,
    description: 'Returns an udated Organization',
  })
  @ApiNotFoundResponse({ description: `No organization found` })
  public async update(@Body() organizationToUpdate: UpdateOrganizationDTO) {
    return await this.organizationService.update(organizationToUpdate);
  }
}
