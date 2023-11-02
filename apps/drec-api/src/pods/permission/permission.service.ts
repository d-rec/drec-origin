
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
import { EntityType, OrganizationStatus, Role, UserPermissionStatus } from '../../utils/enums';
import { DecimalPermissionValue } from '../access-control-layer-module-service/common/permissionBitposition';
import { AccessControlLayerModuleServiceService } from '../access-control-layer-module-service/access-control-layer-module-service.service'
import { UserService } from '../user/user.service'
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
        private readonly userService: UserService,

        private readonly Permissionvalue: DecimalPermissionValue,
    ) { }


    public async create(data: NewPermissionDTO, loginuser: LoggedInUser):
        Promise<PermissionDTO> {
        //console.log(data)
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
        //console.log(addedPermissionList)
        var permissionValue = (this.Permissionvalue.computePermissions(addedPermissionList));
        //console.log(permissionValue)
        const userpermission = await (this.findOne({ aclmodulesId: data.aclmodulesId, entityType: data.entityType, entityId: data.entityId }));
        //console.log("permission69");
        //console.log(userpermission);
        if (!userpermission) {
            const permissionboolean = await this.checkForExistingmodulepermission(data, permissionValue);
            //console.log(permissionboolean)
            if (permissionboolean) {
                const aclpermission = new ACLModulePermissions({
                    ...data,
                    permissionValue: permissionValue,


                });
                if (loginuser.role === Role.OrganizationAdmin && data.entityType != 'Role' || loginuser.role === Role.Admin || loginuser.role === Role.ApiUser) {
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
            // return userpermission;
            //throw new NotFoundException(`Permission For ModuleId  and Role already exist`);
        }

    }
    private async checkForExistingmodulepermission(data: any, newpermissionvalue: number): Promise<boolean> {
        //console.log(data)

        const moduleId = await (this.ACLpermissionService.findOne({ id: data.aclmodulesId }));

        //console.log(moduleId)
        const Ispermission = await (this.Permissionvalue.checkModulePermissionAgainstUserPermission(moduleId.permissionsValue, newpermissionvalue))

        //console.log(Ispermission);
        if (data.permissions.length === Ispermission.length) {
            return true;
        }
        return false;
    }
    async findById(roleId: any, userId: any, modulename: any): Promise<IModulePermissionsConfig[]> {

        const moduleId = await (this.ACLpermissionService.findOne({ name: modulename[0] }));
        //console.log("moduleId",moduleId);

        const userpermission = await (this.repository.find({
            relations: ['aclmodules'],
            where: [
                {
                    entityId: roleId,
                    aclmodulesId: moduleId.id,
                    status: 1
                },
                { entityType: 'User', entityId: userId, aclmodulesId: moduleId.id, status: 1 }
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
        const userpermission = await (this.findOne({ id }));

        var permissionValue = await this.Permissionvalue.computePermissions(addedPermissionList);
        const checkdata = {
            aclmodulesId: userpermission.aclmodulesId,
            permissions: data.permissions
        };
        const permissionboolean = await this.checkForExistingmodulepermission(checkdata, permissionValue);
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
    public async updatepermissionstatus(
        id: number,
        apipermission_status?: UserPermissionStatus
    ): Promise<ExtendedBaseEntity & UpdatePermissionDTO> {
        console.log(apipermission_status)
        if (apipermission_status != undefined && apipermission_status === UserPermissionStatus.Active) {
            await this.repository.update(id, { status: 1 });
        } else if ((apipermission_status != undefined && apipermission_status === UserPermissionStatus.Deactive) || (apipermission_status != undefined && apipermission_status === UserPermissionStatus.Process)) {
            console.log("232process")
            await this.repository.update(id, { status: 0 });
        } else {
            await this.repository.update(id, { status: 1 });
        }
        return this.findOne({ id: id });
    }

    async permisssion_request(data, loginuser): Promise<any> {
        console.log(data);
        if (!data.length) {
            throw new NotFoundException(`No module permission available in requeste`);

        }
            const api_user = await this.userService.findById(loginuser.id)
            console.log(api_user);
            var permissionIds: any = [];

            await Promise.all(
                data.map(
                    async (newpermission: NewPermissionDTO) => {
                        console.log(newpermission);
                        newpermission.entityType = EntityType.User
                        newpermission.entityId = loginuser.id
                        console.log(newpermission);
                        const perId = await this.create(newpermission, loginuser)
                        //console.log(perId);
                        permissionIds.push(perId.id);
                    }),
            );
            console.log(permissionIds);
            //@ts-ignore
            await this.userService.apiuser_permission_request(api_user.api_user_id, permissionIds)

            return { statsu: 'success', message: "Your permission request send successfully" }
       

    }

    async permission_veify(api_user_id, data: any): Promise<any> {
        console.log(data.status)
        const verify_apiuser = await this.userService.apiuser_permission_accepted_byadmin(api_user_id, data.status)
        const pre = verify_apiuser.permissionIds;
        console.log(pre);
        await Promise.all(
            pre.map(
                async (pre: number) =>
                    await this.updatepermissionstatus(pre, data.status)),
        );
        return { statsu: 'success' }
    }


}
