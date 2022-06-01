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
import { InjectRepository } from '@nestjs/typeorm';
import bcrypt from 'bcryptjs';
import {
  FindConditions,
  Repository,
  FindManyOptions,
  SelectQueryBuilder,
} from 'typeorm';
import { AClModules } from './aclmodule.entity';
import { ACLModuleDTO, NewACLModuleDTO, UpdateACLModuleDTO } from './dto/aclmodule.dto';
import { IACLModuleConfig } from '../../models'
import { ExtendedBaseEntity } from '@energyweb/origin-backend-utils';
export type TmoduleBaseEntity = ExtendedBaseEntity & IACLModuleConfig;
import { DecimalPermissionValue } from './common/permissionBitposition';
import { PermissionString } from '../../utils/enums';
@Injectable()
export class AccessControlLayerModuleServiceService {

  addedPermissionList: any = {
    Read: false,
    Write: false,
    Delete: false,
    Update: false,
  };
  private readonly logger = new Logger(AccessControlLayerModuleServiceService.name);
  constructor(
    @InjectRepository(AClModules) private readonly repository: Repository<AClModules>,
    private readonly Permissionvalue: DecimalPermissionValue,
  ) { }


  public async create(data: NewACLModuleDTO): Promise<ACLModuleDTO> {
  
    for (var key in this.addedPermissionList) {
      data.permissions.map((myArr, index) => {
        if (myArr === key) {
          this.addedPermissionList[key] = true;
        }
      })
     
    }
  
    const permissionValue = await this.Permissionvalue.computePermissions(this.addedPermissionList);
   
    await this.checkForExistingmodule(data.name);
    const moduledata = new AClModules({
      ...data,
      permissionsValue:permissionValue,
    })
   
    const module = await this.repository.save(moduledata);
   
    return module;
  }
  private async checkForExistingmodule(name: string): Promise<void> {
    const isExistingUser = await this.hasModule({ name });
    if (isExistingUser) {
      const message = `This Module Permission name ${name} already exists`;

      this.logger.error(message);
      throw new ConflictException({
        success: false,
        message,
      });
    }
  }
  private async hasModule(conditions: FindConditions<AClModules>) {
    return Boolean(await this.findOne(conditions));
  }

  async findById(id: number): Promise<IACLModuleConfig | null> {
    const user = this.findOne({ id });
    if (!user) {
      throw new NotFoundException(`No module found with id ${id}`);
    }
    return user;
  }
  async findOne(conditions: FindConditions<AClModules>): Promise<TmoduleBaseEntity> {
    const module = await (this.repository.findOne(conditions) as Promise<IACLModuleConfig> as Promise<TmoduleBaseEntity>);
    return module;
  }

  async getAll(): Promise<AClModules[]> {
   
    return this.repository.find();
  }
  async update(
    id: number,
    data: UpdateACLModuleDTO,
  ): Promise<ExtendedBaseEntity & IACLModuleConfig> {
    await this.findById(id);
    for (var key in this.addedPermissionList) {
    
      data.permissions.map((myArr, index) => {
        if (myArr === key) {
          this.addedPermissionList[key] = true;
        }
      })
      
    }
   
    const permissionValue = await this.Permissionvalue.computePermissions(this.addedPermissionList);
    await this.repository.update(id, {
     permissions:data.permissions,
     permissionsValue:permissionValue,
    });

    return this.findOne({ id });
  }
}
