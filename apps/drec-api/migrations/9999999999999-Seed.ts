/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { MigrationInterface, QueryRunner } from 'typeorm';
import { providers, Wallet } from 'ethers';
import {
  Contracts,
  Contracts as IssuerContracts,
  IContractsLookup,
} from '@energyweb/issuer';
import { getProviderWithFallback } from '@energyweb/utils-general';

import {
  IFullOrganization,
  IDevice,
  IUserSeed,
  IRoleConfig,
  IACLModuleConfig,
} from '../src/models';
import { v4 as uuid } from 'uuid';
import bcrypt from 'bcryptjs';

import { Logger } from '@nestjs/common';
// import UsersJSON from './users.json';
// import OrganizationsJSON from './organizations.json';
// import DevicesJSON from './devices.json';
const UsersJSON = [];
const OrganizationsJSON = [];
const DevicesJSON = [];

import RoleJSON from './user_role.json';
import AdminJSON from './admin.json';
import ACLModuleJSON from './acl_modules.json';
import { PermissionString } from 'src/utils/enums';

// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config({ path: '../../../.env' });

const issuerAccount = Wallet.fromMnemonic(
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  process.env.MNEMONIC!,
  `m/44'/60'/0'/0/${0}`,
); // Index 0 account

export class Seed9999999999999 implements MigrationInterface {
  private readonly logger = new Logger(Seed9999999999999.name);

  public async up(queryRunner: QueryRunner): Promise<any> {
    const { registry } = await this.seedBlockchain(queryRunner);

    await this.seedUsersRole(queryRunner);
    await this.seedAdmin(queryRunner);
    await this.seedACLModules(queryRunner);
    await queryRunner.query(
      `SELECT setval(
        pg_get_serial_sequence('public.organization', 'id'),
        (
            SELECT MAX("id")
            FROM public.organization
        ) + 1
    );`,
    );
    await queryRunner.query(
      `SELECT setval(
        pg_get_serial_sequence('public.user', 'id'),
        (
            SELECT MAX("id")
            FROM public.user
        ) + 1
    );`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {}

  private async seedBlockchain(
    queryRunner: QueryRunner,
  ): Promise<IContractsLookup> {
    const [primaryRpc, fallbackRpc] = process.env.WEB3!.split(';');
    const provider = getProviderWithFallback(primaryRpc, fallbackRpc);
    const contractsLookup = await this.deployContracts(issuerAccount, provider);

    if (provider && contractsLookup) {
      await queryRunner.query(
        `INSERT INTO public.issuer_blockchain_properties ("netId", "registry", "issuer", "rpcNode", "rpcNodeFallback") VALUES (${
          provider.network.chainId
        }, '${contractsLookup.registry}', '${
          contractsLookup.issuer
        }', '${primaryRpc}', '${fallbackRpc ?? ''}'
        )`,
      );

      await queryRunner.query(
        `INSERT INTO public.issuer_signer ("blockchainNetId", "platformOperatorPrivateKey", "isEncrypted") VALUES (${provider.network.chainId}, '${issuerAccount.privateKey}', false
        )`,
      );
    }

    return contractsLookup;
  }

  private async seedUsersRole(queryRunner: QueryRunner) {
    const userTable = await queryRunner.getTable('public.user_role');

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
  }
  private async deployContracts(
    deployer: Wallet,
    provider: providers.FallbackProvider,
  ): Promise<IContractsLookup> {
    const adminPK = deployer.privateKey.startsWith('0x')
      ? deployer.privateKey
      : `0x${deployer.privateKey}`;
    const registry = await IssuerContracts.migrateRegistry(provider, adminPK);
    const issuer = await IssuerContracts.migrateIssuer(
      provider,
      adminPK,
      registry.address,
    );

    return {
      registry: registry.address,
      issuer: issuer.address,
    };
  }

  private async seedAdmin(queryRunner: QueryRunner) {
    const tableNames = [
      'public.user',
      'public.api_user',
      'public.organization',
    ];

    if (
      process.env.ADMIN_EMAIL == undefined ||
      process.env.ADMIN_PASSWORD == undefined
    ) {
      throw new Error(
        'Please set your environment variables ADMIN_EMAIL and ADMIN_PASSWORD',
      );
    }

    for (const tableName of tableNames) {
      const table = await queryRunner.getTable(tableName);
      if (!table) {
        console.log(`${tableName} table does not exist.`);
        return;
      }
    }

    const adminExists = await queryRunner.query(
      `SELECT id FROM public.user WHERE "role" = '${RoleJSON[0].name}'`,
    );

    if (!adminExists.length) {
      const api_user = await queryRunner.query(`INSERT INTO public.api_user (
        "api_user_id",
        "permission_status"
        ) VALUES (
            '${uuid()}',
            'Request'
        )
        RETURNING "api_user_id"
    `);

      const api_user_id = api_user[0].api_user_id;

      const organization =
        await queryRunner.query(`INSERT INTO public.organization (
        "id",
        "name",
        "address",
        "organizationType",
        "orgEmail",
        "status",
        "api_user_id"
        ) VALUES (
            '${AdminJSON.id}',
            '${AdminJSON.orgName}',
            '${AdminJSON.orgAddress}',
            '${AdminJSON.organizationType}',
            '${process.env.ADMIN_EMAIL.toLowerCase()}',
            '${AdminJSON.status}',
            '${api_user_id}'
        )
        RETURNING "id"
    `);

      const organizationId = organization[0].id;
      const password = bcrypt.hashSync(process.env.ADMIN_PASSWORD, 8);

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
            '${AdminJSON.id}',
            '${AdminJSON.firstName}',
            '${AdminJSON.lastName}',
            '${process.env.ADMIN_EMAIL.toLowerCase()}',
            '${password}',
            '${AdminJSON.status}',
            '${RoleJSON[0].name}',    
            '${organizationId}',
            '${RoleJSON[0].id}',
            '${api_user_id}'
        )`);
    }
  }
  permissionListMAPToBItPOSITIONSAtAPI: Array<{
    permissionString: PermissionString;
    bitPosition: number;
    andOperationNumber: number;
  }> = [
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

  private async seedACLModules(queryRunner: QueryRunner) {
    const tableName = 'public.aclmodules';
    const table = await queryRunner.getTable('public.aclmodules');
    if (!table) {
      console.log(`${tableName} table does not exist.`);
      return;
    }

    const aclModulesExist = await queryRunner.query(
      `SELECT * FROM ${tableName}`,
    );

    if (!aclModulesExist.length) {
      await Promise.all(
        (ACLModuleJSON as unknown as IACLModuleConfig[]).map(
          async (aclModule) => {
            const addedPermissionList: any = {
              Read: false,
              Write: false,
              Delete: false,
              Update: false,
            };
            for (const key in addedPermissionList) {
              aclModule.permissions.map((myArr, index) => {
                if (myArr === key) {
                  addedPermissionList[key] = true;
                }
              });
            }

            const permissionValue =
              await this.computePermissions(addedPermissionList);

            const checkForExistingmodule = await queryRunner.query(
              `SELECT * FROM ${tableName} WHERE "name" = '${aclModule.name}'`,
            );

            if (!checkForExistingmodule.length) {
              queryRunner.query(
                `INSERT INTO public.aclmodules (
                "id", 
                "name", 
                "description", 
                "status" ,
                "permissions",
                "permissionsValue"
              ) VALUES (
                '${aclModule.id}', 
                '${aclModule.name}', 
                '${aclModule.description}', 
                '${aclModule.status}',
                '${aclModule.permissions}',
                '${permissionValue}'
              )`,
              );
            }
          },
        ),
      );
    }
  }

  computePermissions(addedPermissionList: any): number {
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
}
