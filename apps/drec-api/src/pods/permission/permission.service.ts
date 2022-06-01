
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
import { IModulePermissionsConfig, LoggedInUser, IACLmodulsPermissions } from '../../models';
export type TModuleBaseEntity = ExtendedBaseEntity & IModulePermissionsConfig;
import { OrganizationStatus, Role } from '../../utils/enums';
import {AccessControlLayerModuleServiceService} from '../access-control-layer-module-service/access-control-layer-module-service.service'
@Injectable()
export class PermissionService {

    private readonly logger = new Logger(PermissionService.name);
    constructor(
        @InjectRepository(ACLModulePermissions) private readonly repository: Repository<ACLModulePermissions>,
        private readonly ACLpermissionService: AccessControlLayerModuleServiceService,
    ) { }


    public async create(data: NewPermissionDTO, loginuser: LoggedInUser):
        Promise<PermissionDTO> {
       
        const aclpermission = new ACLModulePermissions({
            ...data

        });
        if (loginuser.role === Role.OrganizationAdmin && data.entityType != 'Role' || loginuser.role === Role.Admin) {
            const modulepermission = await this.repository.save(aclpermission);
            return modulepermission;
        } else {
            throw new NotFoundException(`You are not authorized to add module for any Role`);
        }
       
    }

    async findById(roleId:any,userId:any,modulename:any): Promise<IModulePermissionsConfig[]> {
       
        const moduleId = await (this.ACLpermissionService.findOne({name:modulename[0]}));
       
        const userpermission = await (this.repository.find({
            relations: ['aclmodules'],
            where: [
               { entityId: roleId
                , aclmodulesId:moduleId.id,
        },
                {entityType: 'User',entityId: userId,aclmodulesId:moduleId.id} 
            ],
           
        }));
        if (!userpermission) {
            throw new NotFoundException(`No module found `);
        }
        return userpermission;
    }
    async findOne(conditions: FindConditions<ACLModulePermissions>): Promise<ACLModulePermissions> {
        const module = await (this.repository.findOne(conditions) as Promise<IModulePermissionsConfig> as Promise<ACLModulePermissions>);


        return module;
    }
    async getAll(): Promise<ACLModulePermissions[]> {
        const permission = await this.repository.find({
            order: {
                createdAt: 'DESC',
            },
            relations: ['aclmodules'],
        }

        );

        return permission;
    }
    async FindbyRole(id: number): Promise<IACLmodulsPermissions[]> {
        const aclpermission = await this.repository.find({
            where: {
                entityType: 'Role',
                id
            },
            order: {
                createdAt: 'DESC',
            },
        });

        return aclpermission;
    }
    async FindbyUser(id: number): Promise<IACLmodulsPermissions[]> {
        const useraclpermission = await this.repository.find({
            where: {
                entityType: 'User',
                id
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
      
        await this.repository.update(id, {
            permissions: data.permissions

        });

        return this.findOne({ id });
    }
}
