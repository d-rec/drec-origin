import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { FindConditions, Repository } from 'typeorm';
import { ACLModulePermissions } from './permission.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { ExtendedBaseEntity } from '@energyweb/origin-backend-utils';
import {
  PermissionDTO,
  NewPermissionDTO,
  UpdatePermissionDTO,
} from './dto/modulepermission.dto';
import {
  IModulePermissionsConfig,
  LoggedInUser,
  IACLmodulsPermissions,
  IaddModulePermission,
} from '../../models';
export type TModuleBaseEntity = ExtendedBaseEntity & IModulePermissionsConfig;
import { EntityType, Role, UserPermissionStatus } from '../../utils/enums';
import { DecimalPermissionValue } from '../access-control-layer-module-service/common/permissionBitposition';
import { AccessControlLayerModuleServiceService } from '../access-control-layer-module-service/access-control-layer-module-service.service';
import { UserService } from '../user/user.service';
@Injectable()
export class PermissionService {
  addedPermissionList: any = {
    Read: false,
    Write: false,
    Delete: false,
    Update: false,
  };
  private readonly logger = new Logger(PermissionService.name);
  constructor(
    @InjectRepository(ACLModulePermissions)
    private readonly repository: Repository<ACLModulePermissions>,
    private readonly ACLpermissionService: AccessControlLayerModuleServiceService,
    private readonly userService: UserService,

    private readonly Permissionvalue: DecimalPermissionValue,
  ) {}

  public async create(
    data: NewPermissionDTO,
    loginuser: LoggedInUser,
  ): Promise<PermissionDTO> {
    this.logger.verbose(`With in create`);
    const addedPermissionList: any = {
      Read: false,
      Write: false,
      Delete: false,
      Update: false,
    };
    for (var key in addedPermissionList) {
      data.permissions.map((myArr, index) => {
        if (myArr === key) {
          addedPermissionList[key] = true;
        }
      });
    }
    const permissionValue =
      this.Permissionvalue.computePermissions(addedPermissionList);

      const permissionboolean = await this.checkForExistingmodulepermission(
        data,
        permissionValue,
      );
      if (permissionboolean) {
        const aclpermission = new ACLModulePermissions({
          ...data,
          permissionValue: permissionValue,
        });
        if (
          (loginuser.role === Role.OrganizationAdmin &&
            data.entityType != 'Role') ||
          loginuser.role === Role.Admin ||
          loginuser.role === Role.ApiUser
        ) {
          const modulepermission = await this.repository.save(aclpermission);
          return modulepermission;
        } else {
          this.logger.error(
            `You are not authorized to add module for any Role`,
          );
          throw new ConflictException({
            success: false,
            message: `You are not authorized to add module for any Role`,
          });
        }
      } else {
        this.logger.error(`This Permission not available in this module Name`);
        throw new ConflictException({
          success: false,
          message: `This Permission not available in this module Name`,
        });
      }
  }
  private async checkForExistingmodulepermission(
    data: any,
    newpermissionvalue: number,
  ): Promise<boolean> {
    this.logger.verbose(`With in checkForExistingmodulepermission`);
    const moduleId = await this.ACLpermissionService.findOne({
      id: data.aclmodulesId,
    });

    const Ispermission =
      await this.Permissionvalue.checkModulePermissionAgainstUserPermission(
        moduleId.permissionsValue,
        newpermissionvalue,
      );
    if (data.permissions.length === Ispermission.length) {
      return true;
    }
    return false;
  }
  async findById(
    roleId: any,
    userId: any,
    modulename: any,
  ): Promise<IModulePermissionsConfig[]> {
    this.logger.verbose(`With in findById`);
    const moduleId = await this.ACLpermissionService.findOne({
      name: modulename[0],
    });
    const userpermission = await this.repository.find({
      relations: ['aclmodules'],
      where: [
        {
          entityId: roleId,
          aclmodulesId: moduleId.id,
          status: 1,
        },
        {
          entityType: EntityType.User,
          entityId: userId,
          aclmodulesId: moduleId.id,
          status: 1,
        },
      ],
    });

    if (!userpermission) {
      this.logger.error(`No module found`);
      throw new NotFoundException(`No module found `);
    }
    return userpermission;
  }
  async findOne(
    conditions: FindConditions<ACLModulePermissions>,
  ): Promise<ACLModulePermissions> {
    this.logger.verbose(`With in findOne`);
    const module = await (this.repository.findOne(
      conditions,
    ) as Promise<IaddModulePermission> as Promise<ACLModulePermissions>);
    return module;
  }
  async getAll(): Promise<ACLModulePermissions[]> {
    this.logger.verbose(`With in getAll`);
    const permission = await this.repository.find({
      order: {
        createdAt: 'DESC',
      },
      relations: ['aclmodules'],
    });
    return permission;
  }
  async FindbyRole(id: number): Promise<IACLmodulsPermissions[]> {
    this.logger.verbose(`With in FindbyRole`);
    const aclpermission = await this.repository.find({
      relations: ['aclmodules'],
      where: {
        entityType: EntityType.Role,
        entityId: id,
      },
      order: {
        createdAt: 'DESC',
      },
    });

    return aclpermission;
  }
  async FindbyUser(id: number): Promise<IACLmodulsPermissions[]> {
    this.logger.verbose(`With in FindbyUser`);
    const useraclpermission = await this.repository.find({
      relations: ['aclmodules'],
      where: {
        entityType: EntityType.User,
        entityId: id,
      },
      order: {
        createdAt: 'DESC',
      },
    });

    return useraclpermission;
  }
  async update(
    id: number,
    data: UpdatePermissionDTO,
    loginuser: LoggedInUser,
  ): Promise<ExtendedBaseEntity & IACLmodulsPermissions> {
    this.logger.verbose(`With in update`);
    const addedPermissionList: any = {
      Read: false,
      Write: false,
      Delete: false,
      Update: false,
    };
    for (var key in addedPermissionList) {
      data.permissions.map((myArr, index) => {
        if (myArr === key) {
          addedPermissionList[key] = true;
        }
      });
    }
    const userpermission = await this.findOne({ id });

    const permissionValue =
      await this.Permissionvalue.computePermissions(addedPermissionList);
    const checkdata = {
      aclmodulesId: userpermission.aclmodulesId,
      permissions: data.permissions,
    };
    const permissionboolean = await this.checkForExistingmodulepermission(
      checkdata,
      permissionValue,
    );
    if (permissionboolean) {
      if (loginuser.role === Role.ApiUser) {
        await this.repository.update(id, {
          permissions: data.permissions,
          permissionValue: permissionValue,
          status: 0,
        });
      } else {
        await this.repository.update(id, {
          permissions: data.permissions,
          permissionValue: permissionValue,
        });
      }

      return this.findOne({ id });
    } else {
      this.logger.verbose(`This Permission not available in this module Name`);
      throw new NotFoundException(
        `This Permission not available in this module Name`,
      );
    }
  }
  public async updatepermissionstatus(
    id: number,
    apipermission_status?: UserPermissionStatus,
  ): Promise<ExtendedBaseEntity & UpdatePermissionDTO> {
    this.logger.verbose(`With in updatepermissionstatus`);
    if (
      apipermission_status != undefined &&
      apipermission_status === UserPermissionStatus.Active
    ) {
      await this.repository.update(id, { status: 1 });
    } else if (
      apipermission_status != undefined &&
      apipermission_status === UserPermissionStatus.Deactive
    ) {
      this.logger.log('Line No: 232');
      await this.repository.update(id, { status: 0 });
    } else {
      await this.repository.update(id, { status: 1 });
    }
    return this.findOne({ id: id });
  }

  async permisssion_request(data, loginuser): Promise<any> {
    this.logger.verbose(`With in permisssion_request`);
    if (!data.length) {
      this.logger.error(`No module permission available in requeste`);
      throw new NotFoundException(`No module permission available in requeste`);
    }
    const api_user = await this.userService.findById(loginuser.id);

    let permissionIds: any = [];
    const api_userpermission = await this.userService.getApiuser(
      api_user.api_user_id,
    );

    if (
      api_userpermission.permissionIds != null &&
      api_userpermission.permissionIds.length > 0
    ) {
      permissionIds = api_userpermission.permissionIds;
    }

    const userpermissions = await this.repository.find({
      entityType: EntityType.User, 
      entityId: loginuser.id
    });

    const hasId = data.some(aclmodule =>
      userpermissions.some(
        userpermission => userpermission.aclmodulesId === aclmodule.aclmodulesId
      ),
    );

    if(!hasId) {
      await Promise.all(
        data.map(async (newpermission: NewPermissionDTO) => {
          newpermission.entityType = EntityType.User;
          newpermission.entityId = loginuser.id;
          const perId = await this.create(newpermission, loginuser);
  
          permissionIds.push(perId.id);
        }),
      );
      await this.userService.apiuser_permission_request(
        api_user.api_user_id,
        permissionIds,
      );
  
      return {
        statsu: 'success',
        message: 'Your permission request send successfully',
      };
    }
    else if(hasId) {
      this.logger.error(`Permission For ModuleId  and Role already exist`);
      throw new ConflictException({
        success: false,
        message: `Permission For ModuleId  and Role already exist`,
      });
    }
  }

  async permission_veify(api_user_id, data: any): Promise<any> {
    this.logger.verbose(`With in permission_veify`);
    const verify_apiuser =
      await this.userService.apiuser_permission_accepted_byadmin(
        api_user_id,
        data.status,
      );
    const pre = verify_apiuser.permissionIds;
    await Promise.all(
      pre.map(
        async (pre: number) =>
          await this.updatepermissionstatus(pre, data.status),
      ),
    );
    return { statsu: 'success' };
  }
}
