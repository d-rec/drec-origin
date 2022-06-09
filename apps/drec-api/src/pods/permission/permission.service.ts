
import {
    ConflictException,
    Injectable,
    Inject,
    Logger,
    UnprocessableEntityException,
    UnauthorizedException,
    NotFoundException,
    InternalServerErrorException,
    forwardRef
} from '@nestjs/common';
import {
    FindConditions,
    Repository,
    FindManyOptions,
    SelectQueryBuilder,
} from 'typeorm';
import { ACLModulePermissions } from './permission.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { ExtendedBaseEntity } from '@energyweb/origin-backend-utils';
import { PermissionDTO, NewPermissionDTO, UpdatePermissionDTO } from './dto/modulepermission.dto';
import { IModulePermissionsConfig, LoggedInUser, IACLmodulsPermissions, IaddModulePermission } from '../../models';
export type TModuleBaseEntity = ExtendedBaseEntity & IModulePermissionsConfig;
import { OrganizationStatus, Role } from '../../utils/enums';
import { DecimalPermissionValue } from '../access-control-layer-module-service/common/permissionBitposition';
import { AccessControlLayerModuleServiceService } from '../access-control-layer-module-service/access-control-layer-module-service.service'

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
        @InjectRepository(ACLModulePermissions) private readonly repository: Repository<ACLModulePermissions>,
        private readonly ACLpermissionService: AccessControlLayerModuleServiceService,

        private readonly Permissionvalue: DecimalPermissionValue,
    ) { }


    public async create(data: NewPermissionDTO, loginuser: LoggedInUser):
        Promise<PermissionDTO> {
        console.log(data)
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
            })

        }
        console.log(addedPermissionList)
        var permissionValue = await this.Permissionvalue.computePermissions(addedPermissionList);
        console.log(permissionValue)
        const userpermission = await (this.findOne({ aclmodulesId: data.aclmodulesId, entityType: data.entityType, entityId: data.entityId }));
        if (!userpermission) {
            const permissionboolean = await this.checkForExistingmodulepermission(data, permissionValue);
            console.log(permissionboolean)
            if (permissionboolean) {
                const aclpermission = new ACLModulePermissions({
                    ...data,
                    permissionValue: permissionValue,

                });
                if (loginuser.role === Role.OrganizationAdmin && data.entityType != 'Role' || loginuser.role === Role.Admin) {
                    const modulepermission = await this.repository.save(aclpermission);
                    return modulepermission;
                } else {
                    throw new ConflictException({
                        success: false,
                        message: `You are not authorized to add module for any Role`,
                    });

                }
            } else {
                throw new ConflictException({
                    success: false,
                    message: `This Permission not available in this module Name`,
                });

            }
        } else {
            throw new ConflictException({
                success: false,
                message: `Permission For ModuleId  and Role already exist`,
            });
            //throw new NotFoundException(`Permission For ModuleId  and Role already exist`);
        }

    }
    private async checkForExistingmodulepermission(data: any, newpermissionvalue: number): Promise<boolean> {
        console.log(data)

        const moduleId = await (this.ACLpermissionService.findOne({ id: data.aclmodulesId }));

        console.log(moduleId)
        const Ispermission = await (this.Permissionvalue.checkModulePermissionAgainstUserPermission(moduleId.permissionsValue, newpermissionvalue))

        console.log(Ispermission);
        if (data.permissions.length === Ispermission.length) {
            return true;
        }
        return false;
    }
    async findById(roleId: any, userId: any, modulename: any): Promise<IModulePermissionsConfig[]> {

        const moduleId = await (this.ACLpermissionService.findOne({ name: modulename[0] }));

        const userpermission = await (this.repository.find({
            relations: ['aclmodules'],
            where: [
                {
                    entityId: roleId,
                    aclmodulesId: moduleId.id,
                },
                { entityType: 'User', entityId: userId, aclmodulesId: moduleId.id }
            ],

        }));
        if (!userpermission) {
            throw new NotFoundException(`No module found `);
        }
        return userpermission;
    }
    async findOne(conditions: FindConditions<ACLModulePermissions>): Promise<ACLModulePermissions> {
        const module = await (this.repository.findOne(conditions) as Promise<IaddModulePermission> as Promise<ACLModulePermissions>);
        return module;
    }
    async getAll(): Promise<ACLModulePermissions[]> {
        const permission = await this.repository.find({
            order: {
                createdAt: 'DESC',
            },
            relations: ['aclmodules'],
        });
        return permission;
    }
    async FindbyRole(id: number): Promise<IACLmodulsPermissions[]> {
        const aclpermission = await this.repository.find({
            relations: ['aclmodules'],
            where: {
                entityType: 'Role',
                entityId: id,
            },
            order: {
                createdAt: 'DESC',
            },
        });

        return aclpermission;
    }
    async FindbyUser(id: number): Promise<IACLmodulsPermissions[]> {
        const useraclpermission = await this.repository.find({
            relations: ['aclmodules'],
            where: {
                entityType: 'User',
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
    ): Promise<ExtendedBaseEntity & IACLmodulsPermissions> {
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
            })

        }
        console.log(data);
        const userpermission = await (this.findOne({ id }));
        console.log(userpermission);
        console.log(addedPermissionList)
        var permissionValue = await this.Permissionvalue.computePermissions(addedPermissionList);
        const checkdata = {
            aclmodulesId: userpermission.aclmodulesId,
            permissions: data.permissions
        };
        const permissionboolean = await this.checkForExistingmodulepermission(checkdata, permissionValue);
        console.log(permissionboolean)
        if (permissionboolean) {
            await this.repository.update(id, {
                permissions: data.permissions,
                permissionValue: permissionValue,

            });
            return this.findOne({ id });
        } else {
            throw new NotFoundException(`This Permission not available in this module Name`);
        }

    }
}
