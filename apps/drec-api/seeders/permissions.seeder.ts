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
        aclmodulesId: 1, // USER_MANAGEMENT_CRUDL
        entityId: 2, // OrganizationAdmin
        entityType: EntityType.Role,
        permissions: ['Read', 'Write', 'Update', 'Delete'],
        permissionValue: 15, 
        status: 1,
      },
      {
        aclmodulesId: 2, // ORGANIZATION_MANAGEMENT_CRUDL
        entityId: 2, // OrganizationAdmin
        entityType: EntityType.Role,
        permissions: ['Read', 'Write', 'Update', 'Delete'],
        permissionValue: 15, 
        status: 1,
      },
      {
        aclmodulesId: 3, // FILE_MANAGEMENT_CRUDL
        entityId: 2, // OrganizationAdmin
        entityType: EntityType.Role,
        permissions: ['Read', 'Write', 'Update', 'Delete'],
        permissionValue: 15, 
        status: 1,
      },
      {
        aclmodulesId: 4, // ACL Module ID for Device module management
        entityId: 2, // OrganizationAdmin
        entityType: EntityType.Role,
        permissions: ['Read', 'Write', 'Update', 'Delete'],
        permissionValue: 15, 
        status: 1,
      },
      {
        aclmodulesId: 5, // BUYER_RESERVATION_MANAGEMENT_CRUDL
        entityId: 2, // OrganizationAdmin
        entityType: EntityType.Role,
        permissions: ['Read'],
        permissionValue: 15,
        status: 1,
      },
      {
        aclmodulesId: 6, // ACL Module ID for Bulk Device management
        entityId: 2, // OrganizationAdmin
        entityType: EntityType.Role,
        permissions: ['Read', 'Write', 'Update', 'Delete'],
        permissionValue: 15, 
        status: 1,
      },
      {
        aclmodulesId: 7, // READS_MANAGEMENT_CRUDL
        entityId: 2, // OrganizationAdmin
        entityType: EntityType.Role,
        permissions: ['Read', 'Write', 'Update', 'Delete'],
        permissionValue: 15, 
        status: 1,
      },
      {
        aclmodulesId: 8, // CERTIFICATE_LOG_MANAGEMENT_CRUDL
        entityId: 2, // OrganizationAdmin
        entityType: EntityType.Role,
        permissions: ['Read'],
        permissionValue: 1, 
        status: 1,
      },
      {
        aclmodulesId: 9, // INVITATION_MANAGEMENT_CRUDL
        entityId: 2, // OrganizationAdmin
        entityType: EntityType.Role,
        permissions: ['Read', 'Write', 'Update', 'Delete'],
        permissionValue: 15, 
        status: 1, 
      },
      {
        aclmodulesId: 11, //PASSWORD_MANAGEMENT_CRUDL
        entityId: 2, // OrganizationAdmin
        entityType: EntityType.Role,
        permissions: ['Write'],
        permissionValue: 2, 
        status: 1,
      },
      {
        aclmodulesId: 5, // BUYER_RESERVATION_MANAGEMENT_CRUDL
        entityId: 6, // SubBuyer
        entityType: EntityType.Role,
        permissions: ['Read', 'Write'],
        permissionValue: 3, 
        status: 1, 
      },
      {
        aclmodulesId: 8, //CERTIFICATE_LOG_MANAGEMENT_CRUDL
        entityId: 6, // SubBuyer
        entityType: EntityType.Role,
        permissions: ['Read'],
        permissionValue: 1, 
        status: 1,
      },
      {
        aclmodulesId: 9, // INVITATION_MANAGEMENT_CRUDL
        entityId: 6, // SubBuyer
        entityType: EntityType.Role,
        permissions: ['Read', 'Write', 'Update', 'Delete'],
        permissionValue: 15,
        status: 1,
      },
      {
        aclmodulesId: 11, // PASSWORD_MANAGEMENT_CRUDL
        entityId: 6, // SubBuyer
        entityType: EntityType.Role,
        permissions: ['Write'],
        permissionValue: 2,
        status: 1,
      },
      {
        aclmodulesId: 1, // USER_MANAGEMENT_CRUDL
        entityId: 4, // Buyer
        entityType: EntityType.Role,
        permissions: ['Read', 'Write', 'Update'],
        permissionValue: 15,
        status: 1,
      },
      {
        aclmodulesId: 2, // ORGANIZATION_MANAGEMENT_CRUDL
        entityId: 4, // Buyer
        entityType: EntityType.Role,
        permissions: ['Read'],
        permissionValue: 15, 
        status: 1,
      },
      {
        aclmodulesId: 5, // BUYER_RESERVATION_MANAGEMENT_CRUDL
        entityId: 4, // Buyer
        entityType: EntityType.Role,
        permissions: ['Read', 'Write', 'Update', 'Delete'],
        permissionValue: 15, 
        status: 1,
      },
      {
        aclmodulesId: 8, // CERTIFICATE_LOG_MANAGEMENT_CRUDL
        entityId: 4, // Buyer
        entityType: EntityType.Role,
        permissions: ['Read'],
        permissionValue: 1, 
        status: 1,
      },
      {
        aclmodulesId: 9, // INVITATION_MANAGEMENT_CRUDL
        entityId: 4, // Buyer
        entityType: EntityType.Role,
        permissions: ['Read', 'Write', 'Update', 'Delete'],
        permissionValue: 15, 
        status: 1,
      },
      {
        aclmodulesId: 11, // PASSWORD_MANAGEMENT_CRUDL
        entityId: 4, // Buyer
        entityType: EntityType.Role,
        permissions: ['Write'],
        permissionValue: 2, 
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
