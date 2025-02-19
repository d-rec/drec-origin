import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ACLModulePermission } from '../../../src/pods/permission/permission.entity';
import { EntityType } from '../../../src/utils/enums';

@Injectable()
export class PermissionsSeeder {
  constructor(
    @InjectRepository(ACLModulePermission)
    private readonly aclPermissionsRepository: Repository<ACLModulePermission>,
  ) {}

  async seed(): Promise<void> {
    const permissions = this.aclPermissionsRepository.create([
      {
        aclmodulesId: 1,
        entityId: 2,
        entityType: EntityType.Role,
        permissions: ['Read', 'Write', 'Update', 'Delete'],
        permissionValue: 15,
        status: 1,
      },
      {
        aclmodulesId: 2,
        entityId: 2,
        entityType: EntityType.Role,
        permissions: ['Read', 'Write', 'Update', 'Delete'],
        permissionValue: 15,
        status: 1,
      },
      {
        aclmodulesId: 3,
        entityId: 2,
        entityType: EntityType.Role,
        permissions: ['Read', 'Write', 'Update', 'Delete'],
        permissionValue: 15,
        status: 1,
      },
      {
        aclmodulesId: 4,
        entityId: 2,
        entityType: EntityType.Role,
        permissions: ['Read', 'Write', 'Update', 'Delete'],
        permissionValue: 15,
        status: 1,
      },
      {
        aclmodulesId: 5,
        entityId: 2,
        entityType: EntityType.Role,
        permissions: ['Read'],
        permissionValue: 15,
        status: 1,
      },
      {
        aclmodulesId: 6,
        entityId: 2,
        entityType: EntityType.Role,
        permissions: ['Read', 'Write', 'Update', 'Delete'],
        permissionValue: 15,
        status: 1,
      },
      {
        aclmodulesId: 7,
        entityId: 2,
        entityType: EntityType.Role,
        permissions: ['Read', 'Write', 'Update', 'Delete'],
        permissionValue: 15,
        status: 1,
      },
      {
        aclmodulesId: 8,
        entityId: 2,
        entityType: EntityType.Role,
        permissions: ['Read'],
        permissionValue: 1,
        status: 1,
      },
      {
        aclmodulesId: 9,
        entityId: 2,
        entityType: EntityType.Role,
        permissions: ['Read', 'Write', 'Update', 'Delete'],
        permissionValue: 15,
        status: 1,
      },
      {
        aclmodulesId: 11,
        entityId: 2,
        entityType: EntityType.Role,
        permissions: ['Write'],
        permissionValue: 2,
        status: 1,
      },
      {
        aclmodulesId: 1,
        entityId: 6,
        entityType: EntityType.Role,
        permissions: ['Read', 'Write', 'Update'],
        permissionValue: 15,
        status: 1,
      },
      {
        aclmodulesId: 2,
        entityId: 6,
        entityType: EntityType.Role,
        permissions: ['Read'],
        permissionValue: 15,
        status: 1,
      },
      {
        aclmodulesId: 5,
        entityId: 6,
        entityType: EntityType.Role,
        permissions: ['Read', 'Write', 'Update', 'Delete'],
        permissionValue: 15,
        status: 1,
      },
      {
        aclmodulesId: 8,
        entityId: 6,
        entityType: EntityType.Role,
        permissions: ['Read'],
        permissionValue: 1,
        status: 1,
      },
      {
        aclmodulesId: 9,
        entityId: 6,
        entityType: EntityType.Role,
        permissions: ['Read', 'Write', 'Update', 'Delete'],
        permissionValue: 15,
        status: 1,
      },
      {
        aclmodulesId: 11,
        entityId: 6,
        entityType: EntityType.Role,
        permissions: ['Write'],
        permissionValue: 2,
        status: 1,
      },
      {
        aclmodulesId: 1,
        entityId: 4,
        entityType: EntityType.Role,
        permissions: ['Read', 'Write', 'Update'],
        permissionValue: 15,
        status: 1,
      },
      {
        aclmodulesId: 2,
        entityId: 4,
        entityType: EntityType.Role,
        permissions: ['Read'],
        permissionValue: 15,
        status: 1,
      },
      {
        aclmodulesId: 5,
        entityId: 4,
        entityType: EntityType.Role,
        permissions: ['Read', 'Write', 'Update', 'Delete'],
        permissionValue: 15,
        status: 1,
      },
      {
        aclmodulesId: 8,
        entityId: 4,
        entityType: EntityType.Role,
        permissions: ['Read'],
        permissionValue: 1,
        status: 1,
      },
      {
        aclmodulesId: 9,
        entityId: 4,
        entityType: EntityType.Role,
        permissions: ['Read', 'Write', 'Update', 'Delete'],
        permissionValue: 15,
        status: 1,
      },
      {
        aclmodulesId: 11,
        entityId: 4,
        entityType: EntityType.Role,
        permissions: ['Write'],
        permissionValue: 2,
        status: 1,
      },
    ]);

    await this.aclPermissionsRepository.save(permissions);
    console.log('Seed permissions inserted successfully');
  }

  async clear(): Promise<void> {
    await this.aclPermissionsRepository.delete({});
    console.log('Seed permissions cleared successfully');
  }
}
