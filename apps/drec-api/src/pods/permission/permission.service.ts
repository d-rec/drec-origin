import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { FindConditions, Repository } from 'typeorm';
import { ACLModulePermission } from './permission.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { ExtendedBaseEntity } from '@energyweb/origin-backend-utils';
import {
  ApiUserPermissionUpdateDTO,
  NewApiUserPermissionDTO,
  NewPermissionDTO,
  PermissionDTO,
  UpdatePermissionDTO,
} from './dto/modulepermission.dto';
import {
  IACLModulePermission,
  IAddModulePermission,
  ILoggedInUser,
  IModulePermissionsConfig,
  LoggedInUser,
} from '../../models';
import { EntityType, Role, UserPermissionStatus } from '../../utils/enums';
import { DecimalPermissionValue } from '../access-control-layer-module-service/common/permissionBitposition';
import { AccessControlLayerModuleServiceService } from '../access-control-layer-module-service/access-control-layer-module-service.service';
import { UserService } from '../user/user.service';

export type TModuleBaseEntity = ExtendedBaseEntity & IModulePermissionsConfig;

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
    @InjectRepository(ACLModulePermission)
    private readonly repository: Repository<ACLModulePermission>,
    private readonly ACLpermissionService: AccessControlLayerModuleServiceService,
    private readonly userService: UserService,

    private readonly permissionValue: DecimalPermissionValue,
  ) {}

  public async create(
    data: NewPermissionDTO,
    loggedInUser: LoggedInUser,
  ): Promise<PermissionDTO> {
    this.logger.verbose(`With in create`);
    const addedPermissionList: any = {
      Read: false,
      Write: false,
      Delete: false,
      Update: false,
    };
    for (const key in addedPermissionList) {
      data.permissions.map((myArr) => {
        if (myArr === key) {
          addedPermissionList[key] = true;
        }
      });
    }
    const permissionValue =
      this.permissionValue.computePermissions(addedPermissionList);

    const hasPermission = await this.checkForExistingModulePermission(
      data,
      permissionValue,
    );
    if (hasPermission) {
      const aclPermissionService = new ACLModulePermission({
        ...data,
        permissionValue: permissionValue,
      });
      if (
        (loggedInUser.role === Role.OrganizationAdmin &&
          data.entityType != 'Role') ||
        loggedInUser.role === Role.Admin ||
        loggedInUser.role === Role.ApiUser
      ) {
        return await this.repository.save(aclPermissionService);
      } else {
        this.logger.error(`You are not authorized to add module for any Role`);
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
  private async checkForExistingModulePermission(
    data: any,
    newPermissionValue: number,
  ): Promise<boolean> {
    this.logger.verbose(`With in checkForExistingModulePermission`);
    const moduleId = await this.ACLpermissionService.findOne({
      id: data.aclmodulesId,
    });

    const permissions =
      await this.permissionValue.checkModulePermissionAgainstUserPermission(
        moduleId.permissionsValue,
        newPermissionValue,
      );
    if (data.permissions.length === permissions.length) {
      return true;
    }
    return false;
  }
  async findById(
    roleId: number,
    userId: number,
    modulename: string[],
  ): Promise<IModulePermissionsConfig[]> {
    this.logger.verbose(`With in findById`);
    const moduleId = await this.ACLpermissionService.findOne({
      name: modulename[0],
    });
    const userPermission = await this.repository.find({
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

    if (!userPermission) {
      this.logger.error(`No module found`);
      throw new NotFoundException(`No module found `);
    }
    return userPermission;
  }
  async findOne(
    conditions: FindConditions<ACLModulePermission>,
  ): Promise<ACLModulePermission> {
    this.logger.verbose(`With in findOne`);
    return await (this.repository.findOne(
      conditions,
    ) as Promise<IAddModulePermission> as Promise<ACLModulePermission>);
  }
  async getAll(): Promise<ACLModulePermission[]> {
    this.logger.verbose(`With in getAll`);
    return await this.repository.find({
      order: {
        createdAt: 'DESC',
      },
      relations: ['aclmodules'],
    });
  }
  async findByRole(id: number): Promise<IACLModulePermission[]> {
    this.logger.verbose(`With in FindbyRole`);
    return await this.repository.find({
      relations: ['aclmodules'],
      where: {
        entityType: EntityType.Role,
        entityId: id,
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }
  async findByUser(id: number): Promise<IACLModulePermission[]> {
    this.logger.verbose(`With in FindbyUser`);
    return await this.repository.find({
      relations: ['aclmodules'],
      where: {
        entityType: EntityType.User,
        entityId: id,
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }
  async update(
    id: number,
    data: UpdatePermissionDTO,
    loggedInUser: LoggedInUser,
  ): Promise<ExtendedBaseEntity & IACLModulePermission> {
    this.logger.verbose(`With in update`);
    const addedPermissionList: any = {
      Read: false,
      Write: false,
      Delete: false,
      Update: false,
    };
    for (const key in addedPermissionList) {
      data.permissions.map((myArr) => {
        if (myArr === key) {
          addedPermissionList[key] = true;
        }
      });
    }
    //const userPermission = await this.findOne({ id });

    const permissionValue =
      await this.permissionValue.computePermissions(addedPermissionList);
    // const checkData = {
    //   aclmodulesId: userPermission.aclmodulesId,
    //   permissions: data.permissions,
    // };
    const hasPermission = await this.checkForExistingModulePermission(
      PermissionDTO,
      permissionValue,
    );
    if (hasPermission) {
      if (loggedInUser.role === Role.ApiUser) {
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
  public async updatePermissionStatus(
    id: number,
    permissionStatus?: UserPermissionStatus,
  ): Promise<ExtendedBaseEntity & UpdatePermissionDTO> {
    this.logger.verbose(`With in updatepermissionstatus`);
    if (
      permissionStatus != undefined &&
      permissionStatus === UserPermissionStatus.Active
    ) {
      await this.repository.update(id, { status: 1 });
    } else if (
      permissionStatus != undefined &&
      permissionStatus === UserPermissionStatus.Disabled
    ) {
      this.logger.log('Line No: 232');
      await this.repository.update(id, { status: 0 });
    } else {
      await this.repository.update(id, { status: 1 });
    }
    return this.findOne({ id: id });
  }

  async request(
    data: [NewApiUserPermissionDTO],
    loggedInUser: ILoggedInUser,
  ): Promise<any> {
    this.logger.verbose(`With in permisssion_request`);
    if (!data.length) {
      this.logger.error(`No module permission available in requeste`);
      throw new NotFoundException(`No module permission available in requeste`);
    }
    const apiUser = await this.userService.findById(loggedInUser.id);

    let permissionIds: any = [];
    const apiUserPermission = await this.userService.getApiUser(
      apiUser.api_user_id,
    );

    if (
      apiUserPermission.permissionIds != null &&
      apiUserPermission.permissionIds.length > 0
    ) {
      permissionIds = apiUserPermission.permissionIds;
    }

    const userPermissions = await this.repository.find({
      entityType: EntityType.User,
      entityId: loggedInUser.id,
    });

    const hasId = data.some((aclModule) =>
      userPermissions.some(
        (userPermission) =>
          userPermission.aclmodulesId === aclModule.aclmodulesId,
      ),
    );

    if (!hasId) {
      await Promise.all(
        data.map(async (newPermission: NewPermissionDTO) => {
          newPermission.entityType = EntityType.User;
          newPermission.entityId = loggedInUser.id;
          const perId = await this.create(newPermission, loggedInUser);

          permissionIds.push(perId.id);
        }),
      );
      await this.userService.apiUserPermissionRequest(
        apiUser.api_user_id,
        permissionIds,
      );

      return {
        status: 'success',
        message: 'Your permission request send successfully',
      };
    } else if (hasId) {
      this.logger.error(`Permission For ModuleId  and Role already exist`);
      throw new ConflictException({
        success: false,
        message: `Permission For ModuleId  and Role already exist`,
      });
    }
  }
  async verify(
    api_user_id: string,
    data: ApiUserPermissionUpdateDTO,
  ): Promise<any> {
    this.logger.verbose(`With in permission_veify`);
    const verifyApiUser =
      await this.userService.apiUserPermissionAcceptedByAdmin(
        api_user_id,
        data.status,
      );
    const pre = verifyApiUser.permissionIds;
    await Promise.all(
      pre.map(
        async (pre: number) =>
          await this.updatePermissionStatus(pre, data.status),
      ),
    );
    return { status: 'success' };
  }
}
