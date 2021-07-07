import { NullOrUndefinedResultInterceptor } from '@energyweb/origin-backend-utils';
import {
  Controller,
  Get,
  HttpStatus,
  Param,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiResponse,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

import { OrganizationDTO } from './organization.dto';
import { OrganizationService } from './organization.service';
import { UserDTO } from '../user/dto/user.dto';
import { UserDecorator } from '../user/decorators/user.decorator';
import { OrganizationUserDTO } from '../../auth/dto/org-user.dto';

@ApiTags('organization')
@ApiBearerAuth('access-token')
@ApiSecurity('drec')
@Controller('/Organization')
@UseGuards(AuthGuard('jwt'))
@UseInterceptors(NullOrUndefinedResultInterceptor)
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {}

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
}
