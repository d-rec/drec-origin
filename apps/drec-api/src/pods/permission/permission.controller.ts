
import { NullOrUndefinedResultInterceptor } from '@energyweb/origin-backend-utils';
import {
    ClassSerializerInterceptor,
    BadRequestException,
    Controller,
    Get,
    Post,
    Body,
    Put,
    Param,
    ParseIntPipe,
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
    ApiParam,
    ApiSecurity,
    ApiOkResponse
} from '@nestjs/swagger';
import { UserDecorator } from '../user/decorators/user.decorator';
import { PermissionService } from './permission.service'
import { Expose } from 'class-transformer';
import { NewPermissionDTO, PermissionDTO,UpdatePermissionDTO } from '../permission/dto/modulepermission.dto'
import { ActiveUserGuard } from '../../guards';
import { Roles } from '../user/decorators/roles.decorator';
import { RolesGuard } from '../../guards/RolesGuard';
import { Role } from '../../utils/enums';
import { ILoggedInUser } from '../../models';
import {ACLModulePermissions} from './permission.entity'
import {Permission} from './decorators/permission.decorator';
import {ACLModules} from '../access-control-layer-module-service/decorator/aclModule.decorator'
import { PermissionGuard } from '../../guards';
@ApiTags('permission')
@ApiBearerAuth('access-token')
@ApiSecurity('drec')
@Controller('permission')
export class PermissionController {
    constructor(
        private readonly PermissionService: PermissionService,

    ) { }

    @Get()
    @UseGuards(AuthGuard('jwt'))
    @ApiOkResponse({ type: [ACLModulePermissions], description: 'Returns all Permission' })
    async getAll(): Promise<ACLModulePermissions[]> {
        return this.PermissionService.getAll();
      }
    
    @Get('/role/:id')
    @UseGuards(AuthGuard('jwt'), RolesGuard,PermissionGuard)
    @Roles(Role.Admin,Role.OrganizationAdmin)
    @Permission('Read')
    @ACLModules('Add_Permission_Module_CRUDL')
    @ApiResponse({
        status: HttpStatus.OK,
        type: PermissionDTO,
        description: 'Get my user profile',
    })

      async rolepermission( @Param('id', new ParseIntPipe()) id: number): Promise<PermissionDTO[]> {
        return this.PermissionService.FindbyRole(id);
    }

    @Get('/user/:id')
    @UseGuards(AuthGuard('jwt'))
    @ApiResponse({
        status: HttpStatus.OK,
        type: PermissionDTO,
        description: 'Get my user profile',
    })
    //user( { id }: PermissionDTO): Promise<PermissionDTO[] | null> {
    user( @Param('id', new ParseIntPipe()) id: number): Promise<PermissionDTO[] | null> {
        return this.PermissionService.FindbyUser(id);
    }

    @Post('/module')
    @UseGuards(AuthGuard('jwt'), RolesGuard,PermissionGuard)
    @Roles(Role.Admin,Role.OrganizationAdmin)
    @ApiBody({ type: NewPermissionDTO })
    @Permission('Write')
    @ACLModules('Add_Permission_Module_CRUDL')
    @ApiResponse({
        status: HttpStatus.CREATED,
        type: PermissionDTO,
        description: 'Register a user',
    })
    public async register(
        @Body() moduleData: NewPermissionDTO,
        @UserDecorator() loggedUser: ILoggedInUser,
    ): Promise<PermissionDTO> {
        return this.PermissionService.create(moduleData,loggedUser);
    }
   
    @Put('/update/:id')
    @ApiBody({ type: UpdatePermissionDTO })
    @ApiResponse({
        status: HttpStatus.OK,
        type: PermissionDTO,
        description: 'Updates a yield value or status by admin',
    })
    public async updateyield(
        @Param('id', new ParseIntPipe()) id: number,
        @Body() body: UpdatePermissionDTO,
       
    ): Promise<PermissionDTO> {

        return this.PermissionService.update(id, body);
    }
}
