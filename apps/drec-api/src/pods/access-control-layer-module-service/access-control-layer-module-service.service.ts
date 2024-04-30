import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindConditions, Repository } from 'typeorm';
import { AClModules } from './aclmodule.entity';
import {
  ACLModuleDTO,
  NewACLModuleDTO,
  UpdateACLModuleDTO,
} from './dto/aclmodule.dto';
import { IACLModuleConfig } from '../../models';
import { ExtendedBaseEntity } from '@energyweb/origin-backend-utils';
export type TmoduleBaseEntity = ExtendedBaseEntity & IACLModuleConfig;
import { DecimalPermissionValue } from './common/permissionBitposition';

@Injectable()
export class AccessControlLayerModuleServiceService {
  private readonly logger = new Logger(
    AccessControlLayerModuleServiceService.name,
  );
  constructor(
    @InjectRepository(AClModules)
    private readonly repository: Repository<AClModules>,
    private readonly Permissionvalue: DecimalPermissionValue,
  ) {}

  public async create(data: NewACLModuleDTO): Promise<ACLModuleDTO> {
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
      await this.Permissionvalue.computePermissions(addedPermissionList);

    await this.checkForExistingmodule(data.name);
    const moduledata = new AClModules({
      ...data,
      permissionsValue: permissionValue,
    });

    const module = await this.repository.save(moduledata);

    return module;
  }
  private async checkForExistingmodule(name: string): Promise<void> {
    this.logger.verbose(`With in checkForExistingmodule`);
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
    this.logger.verbose(`With in hasModule`);
    return Boolean(await this.findOne(conditions));
  }

  async findById(id: number): Promise<IACLModuleConfig | null> {
    this.logger.verbose(`With in findById`);
    const user = this.findOne({ id });
    if (!user) {
      this.logger.error(`No module found with id ${id}`);
      throw new NotFoundException(`No module found with id ${id}`);
    }
    return user;
  }
  async findOne(
    conditions: FindConditions<AClModules>,
  ): Promise<TmoduleBaseEntity> {
    this.logger.verbose(`With in findOne`);
    const module = await (this.repository.findOne(
      conditions,
    ) as Promise<IACLModuleConfig> as Promise<TmoduleBaseEntity>);
    return module;
  }

  async getAll(): Promise<AClModules[]> {
    this.logger.verbose(`With in getAll`);
    return this.repository.find();
  }
  async update(
    id: number,
    data: UpdateACLModuleDTO,
  ): Promise<ExtendedBaseEntity & IACLModuleConfig> {
    this.logger.verbose(`With in update`);
    await this.findById(id);
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
      await this.Permissionvalue.computePermissions(addedPermissionList);
    await this.repository.update(id, {
      permissions: data.permissions,
      permissionsValue: permissionValue,
    });

    return this.findOne({ id });
  }
}
