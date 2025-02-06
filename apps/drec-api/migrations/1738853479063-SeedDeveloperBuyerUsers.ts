 /* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { MigrationInterface, QueryRunner } from 'typeorm';
import bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';
import { Logger } from '@nestjs/common';
import RoleJSON from './user_role.json';
import { PermissionString } from 'src/utils/enums';
import { IRoleConfig } from 'src/models';

export class SeedDeveloperBuyerUsers1738853479063 implements MigrationInterface {
  private readonly logger = new Logger(SeedDeveloperBuyerUsers1738853479063.name);

  private users = [
    {
      id: 31,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      password: 'somepassword123',
      orgName: 'DevOrg',
      orgAddress: '123 A St.',
      organizationType: 'OrganizationAdmin',
      status: 'Active',
    },
    {
      id: 32,
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@example.com',
      password: 'somepassword456',
      orgName: 'BuyerOrg',
      orgAddress: '456 B St.',
      organizationType: 'Buyer',
      status: 'Active',
    },
  ];

  public async up(queryRunner: QueryRunner): Promise<any> {

    await this.seedUsersAndRoles(queryRunner);
    await this.seedACLModules(queryRunner);
  }

  public async down(queryRunner: QueryRunner): Promise<any> {}

  private async seedUsersAndRoles(queryRunner: QueryRunner) {
    const userTable = await queryRunner.getTable('public.user');
    if (!userTable) {
      this.logger.verbose('user table does not exist.');
      return;
    }
    await Promise.all(
        (RoleJSON as unknown as IRoleConfig[]).map(async (role) => {
          queryRunner.query(
            `INSERT INTO public.user_role (
              "id", 
              "name", 
              "description", 
              "status" 
              ) VALUES (
                '${role.id}', 
                '${role.name}', 
                '${role.description}', 
                '${role.status}'
              )`,
          );
        }),
      );
    for (const user of this.users) {
      const existingUser = await queryRunner.query(
        `SELECT id FROM public.user WHERE "email" = '${user.email.toLowerCase()}'`,
      );
      if (existingUser.length === 0) {
        const apiUser = await queryRunner.query(`INSERT INTO public.api_user (
          "api_user_id",
          "permission_status"
        ) VALUES (
          '${uuid()}',
          'Request'
        ) RETURNING "api_user_id"`);
        
        const apiUserId = apiUser[0].api_user_id;

        const organization = await queryRunner.query(`INSERT INTO public.organization (
          "id",
          "name",
          "address",
          "organizationType",
          "orgEmail",
          "status",
          "api_user_id"
        ) VALUES (
          '${user.id}',
          '${user.orgName}',
          '${user.orgAddress}',
          '${user.organizationType}',
          '${user.email.toLowerCase()}',
          '${user.status}',
          '${apiUserId}'
        ) RETURNING "id"`);
        
        const organizationId = organization[0].id;
        const hashedPassword = bcrypt.hashSync(user.password, 8);
        const roleRecord = RoleJSON.find(r => r.name === user.organizationType);
        if (!roleRecord) {
            this.logger.error(`Role not found for organizationType: ${user.organizationType}`);
            continue; 
          }
        await queryRunner.query(`INSERT INTO public.user (
          "id",
          "firstName",
          "lastName",
          "email",
          "password",
          "status",
          "role",
          "organizationId",
          "roleId",
          "api_user_id"
        ) VALUES (
          '${user.id}',
          '${user.firstName}',
          '${user.lastName}',
          '${user.email.toLowerCase()}',
          '${hashedPassword}',
          '${user.status}',
          '${roleRecord.name}', 
          '${organizationId}',
          '${roleRecord.id}',
          '${apiUserId}'
        )`);
      }
    }
  }

  private permissionListMAPToBItPOSITIONSAtAPI = [
    {
      permissionString: PermissionString.Read,
      bitPosition: 1,
      andOperationNumber: 1,
    },
    {
      permissionString: PermissionString.Write,
      bitPosition: 2,
      andOperationNumber: 2,
    },
    {
      permissionString: PermissionString.Update,
      bitPosition: 3,
      andOperationNumber: 4,
    },
    {
      permissionString: PermissionString.Delete,
      bitPosition: 4,
      andOperationNumber: 8,
    },
  ];

  binaryFormPermission = '0000';
  decimalFormPermission = 0;

  private computePermissions(addedPermissionList: {
    [key in PermissionString]: boolean;
  }): number {
    let binaryFormPermission = '';
    this.permissionListMAPToBItPOSITIONSAtAPI.forEach((ele) => {
      binaryFormPermission =
        (addedPermissionList[ele.permissionString] === true ? '1' : '0') +
        binaryFormPermission;
    });
    this.binaryFormPermission = binaryFormPermission;

    let decimalFormPermission = 0;
    this.permissionListMAPToBItPOSITIONSAtAPI.forEach((ele) => {
      decimalFormPermission =
        decimalFormPermission +
        Math.pow(2, ele.bitPosition - 1) *
          (addedPermissionList[ele.permissionString] === true ? 1 : 0);
    });
    this.decimalFormPermission = decimalFormPermission;
    return this.decimalFormPermission;
  }

  private async seedACLModules(queryRunner: QueryRunner) {

  }
}
