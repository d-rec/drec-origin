import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ACLModulePermission } from '../src/pods/permission/permission.entity';
import { EntityType } from '../src/utils/enums';
import { SeederInterface } from './seeder-interface';

@Injectable()
export class PermissionsSeeder implements SeederInterface {
  constructor(
    @InjectRepository(ACLModulePermission)
    private readonly aclPermissionsRepository: Repository<ACLModulePermission>,
  ) {}

  async run(): Promise<void> {
    const permissions = this.aclPermissionsRepository.create([
      {
        aclmodulesId: 1, // ACL Module ID for User module management
        entityId: 2, // OrganizationAdmin role ID
        entityType: EntityType.Role,
        permissions: ['Read', 'Write', 'Update', 'Delete'],
        permissionValue: 15, // Bitmask representation of permissions
        status: 1,
      },
      {
        aclmodulesId: 2, // ACL Module ID for Organization module management
        entityId: 2, // OrganizationAdmin role ID
        entityType: EntityType.Role,
        permissions: ['Read', 'Write', 'Update', 'Delete'],
        permissionValue: 15, // Bitmask representation of permissions
        status: 1,
      },
      {
        aclmodulesId: 3, // ACL Module ID for Organization module management
        entityId: 2, // OrganizationAdmin role ID
        entityType: EntityType.Role,
        permissions: ['Read', 'Write', 'Update', 'Delete'],
        permissionValue: 15, // Bitmask representation of permissions
        status: 1,
      },
      {
        aclmodulesId: 4, //ACL Module ID for Device module management
        entityId: 2, // OrganizationAdmin role ID
        entityType: EntityType.Role,
        permissions: ['Read', 'Write', 'Update', 'Delete'],
        permissionValue: 15, // Bitmask representation of permissions 
        status: 1,
      },
      {
        aclmodulesId: 5, //ACL Module ID for Buyer Reservation module management
        entityId: 2, // OrganizationAdmin role ID
        entityType: EntityType.Role,
        permissions: ['Read'],
        permissionValue: 15, // Bitmask representation of permissions
        status: 1,
      },
      {
        aclmodulesId: 6, //ACL Module ID for Bulk Device management
        entityId: 2, // OrganizationAdmin role ID
        entityType: EntityType.Role,
        permissions: ['Read', 'Write', 'Update', 'Delete'],
        permissionValue: 15, // Bitmask representation of permissions
        status: 1,
      },
      {
        aclmodulesId: 7, // ACL Module ID for Reads module management
        entityId: 2, // OrganizationAdmin role ID
        entityType: EntityType.Role,
        permissions: ['Read', 'Write', 'Update', 'Delete'],
        permissionValue: 15, // Bitmask representation of permissions
        status: 1,
      },
      {
        aclmodulesId: 8, //ACL Module ID for Certificate Log module management
        entityId: 2, // OrganizationAdmin role ID
        entityType: EntityType.Role,
        permissions: ['Read'],
        permissionValue: 1, // Bitmask representation of permissions
        status: 1,
      },
      {
        aclmodulesId: 9, // ACL Module ID for Invitation module management
        entityId: 2, // OrganizationAdmin role ID
        entityType: EntityType.Role,
        permissions: ['Read', 'Write', 'Update', 'Delete'],
        permissionValue: 15, // Bitmask representation of permissions
        status: 1, 
      },
      {
        aclmodulesId: 11, //ACL Module ID for password management
        entityId: 2, // OrganizationAdmin role ID
        entityType: EntityType.Role,
        permissions: ['Write'],
        permissionValue: 2, // Bitmask representation of permissions
        status: 1,
      },
      {
        aclmodulesId: 1, // ACL Module ID for User module management
        entityId: 6, // SubBuyer role ID
        entityType: EntityType.Role,
        permissions: ['Read', 'Write', 'Update'],
        permissionValue: 15, // Bitmask representation of permissions
        status: 1,
      },
      {
        aclmodulesId: 2, // ACL Module ID for Organization module management
        entityId: 6, // SubBuyer role ID
        entityType: EntityType.Role,
        permissions: ['Read'],
        permissionValue: 15, // Bitmask representation of permissions
        status: 1, 
      },
      {
        aclmodulesId: 5, // ACL Module ID for Buyer Reservation module management
        entityId: 6, // SubBuyer role ID
        entityType: EntityType.Role,
        permissions: ['Read', 'Write', 'Update', 'Delete'],
        permissionValue: 15, // Bitmask representation of permissions
        status: 1, 
      },
      {
        aclmodulesId: 8, //ACL Module ID for Certificate Log module management
        entityId: 6, // SubBuyer role ID
        entityType: EntityType.Role,
        permissions: ['Read'],
        permissionValue: 1, // Bitmask representation of permissions
        status: 1,
      },
      {
        aclmodulesId: 9, // ACL Module ID for Invitation module management
        entityId: 6, // SubBuyer role ID
        entityType: EntityType.Role,
        permissions: ['Read', 'Write', 'Update', 'Delete'],
        permissionValue: 15, // Bitmask representation of permissions
        status: 1,
      },
      {
        aclmodulesId: 11, // ACL Module ID for password management
        entityId: 6, // SubBuyer role ID
        entityType: EntityType.Role,
        permissions: ['Write'],
        permissionValue: 2, // Bitmask representation of permissions
        status: 1,
      },
      {
        aclmodulesId: 1, // ACL Module ID for User module management
        entityId: 4, // Buyer role ID
        entityType: EntityType.Role,
        permissions: ['Read', 'Write', 'Update'],
        permissionValue: 15, //Bitmask representation of permissions
        status: 1,
      },
      {
        aclmodulesId: 2, // ACL Module ID for Organization module management
        entityId: 4, // Buyer role ID
        entityType: EntityType.Role,
        permissions: ['Read'],
        permissionValue: 15, //Bitmask representation of permissions
        status: 1,
      },
      {
        aclmodulesId: 5, // ACL Module ID for Buyer Reservation module management
        entityId: 4, // Buyer role ID
        entityType: EntityType.Role,
        permissions: ['Read', 'Write', 'Update', 'Delete'],
        permissionValue: 15, // Bitmask representation of permissions
        status: 1,
      },
      {
        aclmodulesId: 8, // ACL Module ID for Certificate Log module management
        entityId: 4, // Buyer role ID
        entityType: EntityType.Role,
        permissions: ['Read'],
        permissionValue: 1, // Bitmask representation of permissions
        status: 1,
      },
      {
        aclmodulesId: 9, // ACL Module ID for Invitation module management
        entityId: 4, // Buyer role ID
        entityType: EntityType.Role,
        permissions: ['Read', 'Write', 'Update', 'Delete'],
        permissionValue: 15, // Bitmask representation of permissions
        status: 1,
      },
      {
        aclmodulesId: 11, // ACL Module ID for password management
        entityId: 4, // Buyer role ID
        entityType: EntityType.Role,
        permissions: ['Write'],
        permissionValue: 2, // Bitmask representation of permissions
        status: 1,
      },
    ]);

    await this.aclPermissionsRepository.save(permissions);
    console.log('Seed permissions inserted successfully');
  }

  async drop(): Promise<void> {
    await this.aclPermissionsRepository.delete({});
    console.log('Seed permissions cleared successfully');
  }
}
