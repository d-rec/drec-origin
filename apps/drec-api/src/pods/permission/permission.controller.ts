import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  ParseIntPipe,
  HttpStatus,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiResponse,
  ApiBody,
  ApiTags,
  ApiSecurity,
  ApiOkResponse,
} from '@nestjs/swagger';
import { UserDecorator } from '../user/decorators/user.decorator';
import { PermissionService } from './permission.service';
import {
  NewPermissionDTO,
  PermissionDTO,
  UpdatePermissionDTO,
  NewApiUserPermissionDTO,
  ApiUserPermissionUpdateDTO,
} from '../permission/dto/modulepermission.dto';
import { Roles } from '../user/decorators/roles.decorator';
import { RolesGuard } from '../../guards/RolesGuard';
import { Role } from '../../utils/enums';
import { ILoggedInUser } from '../../models';
import { ACLModulePermissions } from './permission.entity';
import { Permission } from './decorators/permission.decorator';
import { ACLModules } from '../access-control-layer-module-service/decorator/aclModule.decorator';
import { PermissionGuard } from '../../guards';
@ApiTags('permission')
@ApiBearerAuth('access-token')
@ApiSecurity('drec')
@Controller('permission')
export class PermissionController {
  private readonly logger = new Logger(PermissionController.name);

  constructor(private readonly PermissionService: PermissionService) {}

  /**
   * This api use for get the all list of User and Role base permission
   * @returns {ACLModulePermissions[]}
   */
  @Get()
  @UseGuards(AuthGuard('jwt'), PermissionGuard)
  @Permission('Read')
  @ACLModules('PERMISSION_MANAGEMENT_CRUDL')
  @ApiOkResponse({
    type: [ACLModulePermissions],
    description: 'Returns all Permission',
  })
  async getAll(): Promise<ACLModulePermissions[]> {
    this.logger.verbose(`With in getAll`);
    return this.PermissionService.getAll();
  }
  /**
   * This api route use for get list permission of user role
   * @param id :number "id means role id"
   * @returns {ACLModulePermissions[]}
   */
  @Get('/role/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionGuard)
  @Roles(Role.Admin, Role.OrganizationAdmin)
  @Permission('Read')
  @ACLModules('PERMISSION_MANAGEMENT_CRUDL')
  @ApiResponse({
    status: HttpStatus.OK,
    type: PermissionDTO,
    description: 'Get list of user role permission',
  })
  async rolepermission(
    @Param('id', new ParseIntPipe()) id: number,
  ): Promise<PermissionDTO[]> {
    this.logger.verbose(`With in rolepermission`);
    return this.PermissionService.FindbyRole(id);
  }

  /**
   * This api rout use for get permission of Role not related what the role of user
   * @param id :number "id means user id"
   * @returns {ACLModulePermissions[]}
   */
  @Get('/user/:id')
  @UseGuards(AuthGuard('jwt'))
  @Permission('Read')
  @ACLModules('PERMISSION_MANAGEMENT_CRUDL')
  @ApiResponse({
    status: HttpStatus.OK,
    type: PermissionDTO,
    description: 'Get list of user permission',
  })
  //user( { id }: PermissionDTO): Promise<PermissionDTO[] | null> {
  user(
    @Param('id', new ParseIntPipe()) id: number,
  ): Promise<PermissionDTO[] | null> {
    this.logger.verbose(`With in user`);
    return this.PermissionService.FindbyUser(id);
  }
  /**
   * This api route use to add permission for all role by admin
   * @param moduleData {NewPermissionDTO}
   * @param loggedUser {ILoggedInUser} "login details"
   * @returns {PermissionDTO}
   */
  @Post('/module')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionGuard)
  @Roles(Role.Admin, Role.OrganizationAdmin)
  @ApiBody({ type: NewPermissionDTO })
  @Permission('Write')
  @ACLModules('PERMISSION_MANAGEMENT_CRUDL')
  @ApiResponse({
    status: HttpStatus.CREATED,
    type: PermissionDTO,
    description: 'Permission added sucessfull',
  })
  public async register(
    @Body() moduleData: NewPermissionDTO,
    @UserDecorator() loggedUser: ILoggedInUser,
  ): Promise<PermissionDTO> {
    this.logger.verbose(`With in register`);
    return this.PermissionService.create(moduleData, loggedUser);
  }
  /**
   * This api route use for update the permission of user and role
   * @param id
   * @param body
   * @returns
   */
  @Put('/update/:id')
  @UseGuards(AuthGuard(['jwt', 'oauth2-client-password']))
  @ApiBody({ type: UpdatePermissionDTO })
  @Permission('Write')
  @ACLModules('PERMISSION_MANAGEMENT_CRUDL')
  @ApiResponse({
    status: HttpStatus.OK,
    type: PermissionDTO,
    description:
      'Updates a permission (Read,Write,Delete,Update) or status by admin',
  })
  public async updateyield(
    @Param('id', new ParseIntPipe()) id: number,
    @Body() body: UpdatePermissionDTO,
    @UserDecorator() loggedUser: ILoggedInUser,
  ): Promise<PermissionDTO> {
    this.logger.verbose(`With in updateyield`);
    return this.PermissionService.update(id, body, loggedUser);
  }
  /**
   * This api route use for make a request of permission to use api with module select by apiuser
   * @param moduleData
   * @param loggedUser
   * @returns {PermissionDTO}
   */
  @Post('/module/apiuser/request')
  @UseGuards(AuthGuard(['jwt', 'oauth2-client-password']), RolesGuard)
  @Roles(Role.ApiUser)
  @ApiBody({ type: [NewApiUserPermissionDTO] })
  @ApiResponse({
    status: HttpStatus.CREATED,
    type: PermissionDTO,
    description: 'Request of permission from ApiUser',
  })
  public async apiuser_modulerequest(
    //  @Param('apiuserId') api_user_id: string,
    @Body() moduleData: [NewApiUserPermissionDTO],
    @UserDecorator() loggedUser: ILoggedInUser,
  ): Promise<{ statsu: string; message: string }> {
    this.logger.verbose(`With in apiuser_modulerequest`);
    return this.PermissionService.permisssion_request(moduleData, loggedUser);
  }

  /**
   * This api route use for aprrove the apiuser permission request by admin
   * @param api_user_id:string
   * @param moduleData {ApiUserPermissionUpdateDTO}
   * @param loggedUser
   * @returns {statsu:string,message:string}
   */
  @Put('/module/verify/ByAdmin/:apiuserId')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.Admin)
  @ApiBody({ type: ApiUserPermissionUpdateDTO })
  @ApiResponse({
    status: HttpStatus.CREATED,
    type: PermissionDTO,
    description: 'Request for api user',
  })
  public async apiuser_moduleapprove(
    @Param('apiuserId') api_user_id: string,
    @Body() moduleData: ApiUserPermissionUpdateDTO,
    @UserDecorator() loggedUser: ILoggedInUser,
  ): Promise<{ statsu: string; message: string }> {
    this.logger.verbose(`With in apiuser_moduleapprove`);
    return this.PermissionService.permission_veify(api_user_id, moduleData);
  }
}
