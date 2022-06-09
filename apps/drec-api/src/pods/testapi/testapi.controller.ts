import {
  ClassSerializerInterceptor,
  BadRequestException,
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Patch,
  ParseIntPipe,
  HttpStatus,
  UseGuards,
  UseInterceptors,
  Delete
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiResponse,
  ApiBody,
  ApiTags,
  ApiUnprocessableEntityResponse,
  ApiParam,
  ApiSecurity,
  ApiOkResponse
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { TestapiService } from './testapi.service';
import { CreateTestapiDto } from './dto/create-testapi.dto';
import { UpdateTestapiDto } from './dto/update-testapi.dto';
import { Roles } from '../user/decorators/roles.decorator';
import { RolesGuard } from '../../guards/RolesGuard';
import { Role } from '../../utils/enums';
import {Permission} from '../permission/decorators/permission.decorator';
import {ACLModules} from '../access-control-layer-module-service/decorator/aclModule.decorator';
import { PermissionGuard } from 'src/guards';
@ApiTags('TESTApi')
@ApiBearerAuth('access-token')
@ApiSecurity('drec')
@Controller('testapi')
export class TestapiController {
  constructor(private readonly testapiService: TestapiService) {}

  @Post()
   @UseGuards(AuthGuard('jwt'), RolesGuard,PermissionGuard)
   @Roles(Role.Admin,Role.OrganizationAdmin)
  @Permission('Write')
  @ACLModules('Test_CRDUL')
  create(@Body() createTestapiDto: CreateTestapiDto) {
    return this.testapiService.create(createTestapiDto);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'), RolesGuard,PermissionGuard)
  @Roles(Role.Admin,Role.OrganizationAdmin)
  @Permission('Read')
  @ACLModules('Test_CRDUL')
  findAll() {
    return this.testapiService.findAll();
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard,PermissionGuard)
  @Roles(Role.Admin,Role.OrganizationAdmin)
  @Permission('Read')
  @ACLModules('Test_CRDUL')
  findOne(@Param('id') id: string) {
    return this.testapiService.findOne(+id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard,PermissionGuard)
  @Roles(Role.Admin,Role.OrganizationAdmin)
  @Permission('Update')
  @ACLModules('Test_CRDUL')
  update(@Param('id') id: string, @Body() updateTestapiDto: UpdateTestapiDto) {
    return this.testapiService.update(+id, updateTestapiDto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard,PermissionGuard)
  @Roles(Role.Admin,Role.OrganizationAdmin)
  @Permission('Delete')
  @ACLModules('Test_CRDUL')
  remove(@Param('id') id: string) {
    return this.testapiService.remove(+id);
  }
}
