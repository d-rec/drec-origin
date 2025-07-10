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
import {
  ApiBearerAuth,
  ApiResponse,
  ApiBody,
  ApiTags,
  ApiSecurity,
  ApiOperation,
} from '@nestjs/swagger';
import { UserDecorator } from '../user/decorators/user.decorator';
import { PermissionService } from './permission.service'; // eslint-disable-line @typescript-eslint/no-unused-vars
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
import { ACLModulePermission } from './permission.entity';
import { Permission } from './decorators/permission.decorator';
import { ACLModules } from '../access-control-layer-module-service/decorator/aclModule.decorator';
import { AuthVerifiedGuard, PermissionGuard } from '../../guards'; // eslint-disable-line @typescript-eslint/no-unused-vars
@ApiTags('Permissions')
@ApiBearerAuth('access-token')
@ApiSecurity('drec')
@Controller('permission')
export class PermissionController {
  private readonly logger = new Logger(PermissionController.name);

  constructor(private readonly PermissionService: PermissionService) {}

  /**
   * This api use for get the all list of User and Role base permission
   * @returns {ACLModulePermission[]}
   */
  @Get()
  @UseGuards(AuthVerifiedGuard('jwt'), PermissionGuard)
  @Permission('Read')
  @ACLModules('PERMISSION_MANAGEMENT_CRUDL')
  @ApiOperation({
    summary: 'Get All Permissions',
    description: 'Retrieves a list of all permissions available in the system.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: [PermissionDTO],
    description: 'Returns an array of permissions.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized access. The user must be authenticated.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description:
      'Forbidden. The user does not have permission to access this resource.',
  })
  async getAll(): Promise<ACLModulePermission[]> {
    this.logger.verbose(`With in getAll`);
    return this.PermissionService.getAll();
  }
  /**
   * This api route use for get list permission of user role
   * @param id :number "id means role id"
   * @returns {ACLModulePermission[]}
   */
  @Get('/role/:id')
  @UseGuards(AuthVerifiedGuard('jwt'), RolesGuard, PermissionGuard)
  @Roles(Role.Admin, Role.OrganizationAdmin)
  @Permission('Read')
  @ACLModules('PERMISSION_MANAGEMENT_CRUDL')
  @ApiOperation({
    summary: 'Get Permissions by Role ID',
    description: 'Retrieves permissions associated with a specific role ID.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: [PermissionDTO],
    description: 'Returns an array of permissions for the specified role.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Not Found. The specified role does not exist.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized access. The user must be authenticated.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description:
      'Forbidden. The user does not have permission to access this resource.',
  })
  async rolePermission(
    @Param('id', new ParseIntPipe()) id: number,
  ): Promise<PermissionDTO[]> {
    this.logger.verbose(`With in rolepermission`);
    return this.PermissionService.findByRole(id);
  }

  /**
   * This api rout use for get permission of Role not related what the role of user
   * @param id :number "id means user id"
   * @returns {ACLModulePermission[]}
   */
  @Get('/user/:id')
  @UseGuards(AuthVerifiedGuard('jwt'))
  @Permission('Read')
  @ACLModules('PERMISSION_MANAGEMENT_CRUDL')
  @ApiOperation({
    summary: 'Get Permissions by User ID',
    description: 'Retrieves permissions associated with a specific user ID.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: [PermissionDTO],
    description: 'Returns an array of permissions for the specified user.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Not Found. The specified user does not exist.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized access. The user must be authenticated.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description:
      'Forbidden. The user does not have permission to access this resource.',
  })
  user(
    @Param('id', new ParseIntPipe()) id: number,
  ): Promise<PermissionDTO[] | null> {
    this.logger.verbose(`With in user`);
    return this.PermissionService.findByUser(id);
  }
  /**
   * This api route use to add permission for all role by admin
   * @param moduleData {NewPermissionDTO}
   * @param loggedUser {ILoggedInUser} "login details"
   * @returns {PermissionDTO}
   */
  @Post('/module')
  @UseGuards(AuthVerifiedGuard('jwt'), RolesGuard, PermissionGuard)
  @Roles(Role.Admin, Role.OrganizationAdmin)
  @ApiBody({ type: NewPermissionDTO })
  @Permission('Write')
  @ACLModules('PERMISSION_MANAGEMENT_CRUDL')
  @ApiOperation({
    summary: 'Create Permission',
    description: 'Creates a new permission in the system.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    type: PermissionDTO,
    description: 'Permission added successfully.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description:
      'Bad Request. The provided data is invalid or missing required fields.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description:
      'Forbidden. The user does not have permission to create permissions.',
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
  @UseGuards(AuthVerifiedGuard(['jwt', 'oauth2-client-password']))
  @ApiBody({ type: UpdatePermissionDTO })
  @Permission('Write')
  @ACLModules('PERMISSION_MANAGEMENT_CRUDL')
  @ApiOperation({
    summary: 'Update Permission',
    description: 'Updates an existing permission based on the provided ID.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: PermissionDTO,
    description: 'Returns the updated permission.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Not Found. The specified permission does not exist.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description:
      'Bad Request. The provided data is invalid or missing required fields.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description:
      'Forbidden. The user does not have permission to update permissions.',
  })
  public async updateYield(
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
  @UseGuards(AuthVerifiedGuard(['jwt', 'oauth2-client-password']), RolesGuard)
  @Roles(Role.ApiUser)
  @ApiBody({ type: [NewApiUserPermissionDTO] })
  @ApiOperation({
    summary: 'Request Permission for API User',
    description:
      'Allows an API user to request permissions for specific modules.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    type: PermissionDTO,
    description: 'Request of permission from ApiUser.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description:
      'Bad Request. The provided data is invalid or missing required fields.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description:
      'Forbidden. The user does not have permission to request permissions.',
  })
  public async apiUserModuleRequest(
    //  @Param('apiUserId') apiUserId: string,
    @Body() moduleData: [NewApiUserPermissionDTO],
    @UserDecorator() loggedUser: ILoggedInUser,
  ): Promise<{ status: string; message: string }> {
    this.logger.verbose(`With in apiuser_modulerequest`);
    return this.PermissionService.request(moduleData, loggedUser);
  }

  /**
   * This api route use for aprrove the apiuser permission request by admin
   * @param apiUserId:string
   * @param moduleData {ApiUserPermissionUpdateDTO}
   * @param loggedUser
   * @returns {status:string,message:string}
   */
  @Put('/module/verify/ByAdmin/:apiUserId')
  @UseGuards(AuthVerifiedGuard('jwt'), RolesGuard)
  @Roles(Role.Admin)
  @ApiBody({ type: ApiUserPermissionUpdateDTO })
  @ApiOperation({
    summary: 'Approve API User Permission Request',
    description:
      'Allows an admin to approve permission requests made by API users. The admin provides the API user ID and the updated permission data.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    type: PermissionDTO,
    description: 'Successfully approved the API user permission request.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Not Found. The specified API user does not exist.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description:
      'Forbidden. The user does not have permission to approve permission requests.',
  })
  public async apiUserModuleApprove(
    @Param('apiUserId') apiUserId: string,
    @Body() moduleData: ApiUserPermissionUpdateDTO,
  ): Promise<{ status: string; message: string }> {
    this.logger.verbose(`With in apiuser_moduleapprove`);
    return this.PermissionService.verify(apiUserId, moduleData);
  }
}
