/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { MigrationInterface, QueryRunner } from 'typeorm';
import { providers, Wallet } from 'ethers';
import {
  Contracts as IssuerContracts,
  IContractsLookup,
} from '@energyweb/issuer';
import { getProviderWithFallback } from '@energyweb/utils-general';

import {
  IRoleConfig,
  IACLModuleConfig,
} from '../src/models';
import { v4 as uuid } from 'uuid';
import bcrypt from 'bcryptjs';

import { Logger } from '@nestjs/common';

import RoleJSON from './user_role.json';
import AdminJSON from './admin.json';
import ACLModuleJSON from './acl_modules.json';
import { PermissionString } from '../src/utils/enums';

// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config({ path: '../../../.env' });

const issuerAccount = new Wallet(process.env.ISSUER_PRIVATE_KEY!);
const CERTIFICATE_REGISTRY_ADDRESS = process.env.CERTIFICATE_REGISTRY_ADDRESS;
const ISSUER_CONTRACT_ADDRESS = process.env.ISSUER_CONTRACT_ADDRESS;
export class Seed9999999999999 implements MigrationInterface {
  private readonly logger = new Logger(Seed9999999999999.name);

  public async up(queryRunner: QueryRunner): Promise<any> {
    await this.seedBlockchain(queryRunner);

    await this.seedUsersRole(queryRunner);
    await this.seedAdmin(queryRunner);
    await this.seedRegistrant(queryRunner);
    await this.seedReviewer(queryRunner);
    await this.seedBuyer(queryRunner);
    await this.seedACLModules(queryRunner);
    await this.seedCertificateSetting(queryRunner); //set default no_of_days for generate certificate last day
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

    // wait for the provider to be ready
    await provider?.ready;

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
    if (CERTIFICATE_REGISTRY_ADDRESS && ISSUER_CONTRACT_ADDRESS) {
      return {
        registry: CERTIFICATE_REGISTRY_ADDRESS,
        issuer: ISSUER_CONTRACT_ADDRESS,
      };
    }

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
      const apiUser = await queryRunner.query(`INSERT INTO public.api_user (
        "api_user_id",
        "permission_status"
        ) VALUES (
            '${uuid()}',
            'Request'
        )
        RETURNING "api_user_id"
    `);

      const apiUserId = apiUser[0].api_user_id;

      const organization =
        await queryRunner.query(`INSERT INTO public.organization (
        "id",
        "name",
        "address",
        "organizationType",
        "orgEmail",
        "status",
        "api_user_id",
        "verified_at"
        ) VALUES (
            '${AdminJSON.id}',
            '${AdminJSON.orgName}',
            '${AdminJSON.orgAddress}',
            '${AdminJSON.organizationType}',
            '${process.env.ADMIN_EMAIL.toLowerCase()}',
            '${AdminJSON.status}',
            '${apiUserId}',
            '${new Date().toISOString()}'
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
        "api_user_id",
        "phone_number_verified_at",
        "email_verified_at",
        "terms_accepted_at"
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
            '${apiUserId}',
            '${AdminJSON.phone_number_verified_at}',
            '${new Date().toISOString()}',
            '${new Date().toISOString()}'
        )`);
    }
  }
  private async seedRegistrant(queryRunner: QueryRunner) {
    const email = process.env.APIUSER_EMAIL;
    const pass = process.env.APIUSER_PASSWORD;
    if (!email || !pass) {
      this.logger.verbose('APIUSER_EMAIL / APIUSER_PASSWORD not set — skipping registrant seed.');
      return;
    }

    const existing = await queryRunner.query(
      `SELECT id FROM public.user WHERE "email" = '${email.toLowerCase()}'`,
    );
    if (existing.length) {
      this.logger.verbose(`Registrant ${email} already exists — skipping.`);
      return;
    }

    const apiUser = await queryRunner.query(`INSERT INTO public.api_user (
      "api_user_id",
      "permission_status"
    ) VALUES (
      '${uuid()}',
      'Request'
    ) RETURNING "api_user_id"`);

    const apiUserId = apiUser[0].api_user_id;

    const organization = await queryRunner.query(`INSERT INTO public.organization (
      "name",
      "address",
      "organizationType",
      "orgEmail",
      "status",
      "api_user_id",
      "verified_at"
    ) VALUES (
      'Evident Demo',
      'Demo Address',
      'Registrant',
      '${email.toLowerCase()}',
      'Active',
      '${apiUserId}',
      '${new Date().toISOString()}'
    ) RETURNING "id"`);

    const organizationId = organization[0].id;
    const password = bcrypt.hashSync(pass, 8);

    await queryRunner.query(`INSERT INTO public.user (
      "firstName",
      "lastName",
      "email",
      "password",
      "status",
      "role",
      "organizationId",
      "roleId",
      "api_user_id",
      "phone_number_verified_at",
      "email_verified_at",
      "terms_accepted_at"
    ) VALUES (
      'Evident',
      'Demo',
      '${email.toLowerCase()}',
      '${password}',
      'Active',
      'Registrant',
      '${organizationId}',
      6,
      '${apiUserId}',
      '0001-01-01T00:00:00Z',
      '${new Date().toISOString()}',
      '${new Date().toISOString()}'
    )`);

    this.logger.verbose(`Seeded registrant: ${email}`);
  }

  private async seedReviewer(queryRunner: QueryRunner) {
    const email = process.env.REVIEWER_EMAIL;
    const pass = process.env.REVIEWER_PASSWORD;
    if (!email || !pass) {
      this.logger.verbose('REVIEWER_EMAIL / REVIEWER_PASSWORD not set — skipping reviewer seed.');
      return;
    }

    const existing = await queryRunner.query(
      `SELECT id FROM public.user WHERE "email" = '${email.toLowerCase()}'`,
    );
    if (existing.length) {
      this.logger.verbose(`Reviewer ${email} already exists — skipping.`);
      return;
    }

    // Reviewer belongs to the admin org (SuperOrg, id=1)
    const adminOrg = await queryRunner.query(
      `SELECT id FROM public.organization WHERE id = 1`,
    );
    if (!adminOrg.length) {
      this.logger.warn('Admin org (id=1) not found — cannot seed reviewer.');
      return;
    }

    const apiUser = await queryRunner.query(`INSERT INTO public.api_user (
      "api_user_id",
      "permission_status"
    ) VALUES (
      '${uuid()}',
      'Request'
    ) RETURNING "api_user_id"`);

    const apiUserId = apiUser[0].api_user_id;
    const password = bcrypt.hashSync(pass, 8);

    await queryRunner.query(`INSERT INTO public.user (
      "firstName",
      "lastName",
      "email",
      "password",
      "status",
      "role",
      "organizationId",
      "roleId",
      "api_user_id",
      "phone_number_verified_at",
      "email_verified_at",
      "terms_accepted_at"
    ) VALUES (
      'John',
      'Reviewer',
      '${email.toLowerCase()}',
      '${password}',
      'Active',
      'Reviewer',
      1,
      1,
      '${apiUserId}',
      '0001-01-01T00:00:00Z',
      '${new Date().toISOString()}',
      '${new Date().toISOString()}'
    )`);

    this.logger.verbose(`Seeded reviewer: ${email}`);
  }

  private async seedBuyer(queryRunner: QueryRunner) {
    const email = process.env.BUYER_EMAIL;
    const pass = process.env.BUYER_PASSWORD;
    if (!email || !pass) {
      this.logger.verbose('BUYER_EMAIL / BUYER_PASSWORD not set — skipping buyer seed.');
      return;
    }

    const existing = await queryRunner.query(
      `SELECT id FROM public.user WHERE "email" = '${email.toLowerCase()}'`,
    );
    if (existing.length) {
      this.logger.verbose(`Buyer ${email} already exists — skipping.`);
      return;
    }

    const apiUser = await queryRunner.query(`INSERT INTO public.api_user (
      "api_user_id",
      "permission_status"
    ) VALUES (
      '${uuid()}',
      'Request'
    ) RETURNING "api_user_id"`);

    const apiUserId = apiUser[0].api_user_id;

    const organization = await queryRunner.query(`INSERT INTO public.organization (
      "name",
      "address",
      "organizationType",
      "orgEmail",
      "status",
      "api_user_id",
      "verified_at"
    ) VALUES (
      'Buyer Demo Corp',
      'Demo Address',
      'Buyer',
      '${email.toLowerCase()}',
      'Active',
      '${apiUserId}',
      '${new Date().toISOString()}'
    ) RETURNING "id"`);

    const organizationId = organization[0].id;
    const password = bcrypt.hashSync(pass, 8);

    await queryRunner.query(`INSERT INTO public.user (
      "firstName",
      "lastName",
      "email",
      "password",
      "status",
      "role",
      "organizationId",
      "roleId",
      "api_user_id",
      "phone_number_verified_at",
      "email_verified_at",
      "terms_accepted_at"
    ) VALUES (
      'Jane',
      'Buyer',
      '${email.toLowerCase()}',
      '${password}',
      'Active',
      'Buyer',
      '${organizationId}',
      4,
      '${apiUserId}',
      '0001-01-01T00:00:00Z',
      '${new Date().toISOString()}',
      '${new Date().toISOString()}'
    )`);

    this.logger.verbose(`Seeded buyer: ${email}`);
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

    for (const aclModule of ACLModuleJSON as unknown as IACLModuleConfig[]) {
      const addedPermissionList: { [key in PermissionString]: boolean } = {
        Read: false,
        Write: false,
        Delete: false,
        Update: false,
      };
      for (const key in addedPermissionList) {
        aclModule.permissions.forEach((myArr) => {
          if (myArr === key) {
            addedPermissionList[key] = true;
          }
        });
      }

      const permissionValue = this.computePermissions(addedPermissionList);

      const checkForExistingModule = await queryRunner.query(
        `SELECT * FROM ${tableName} WHERE "name" = '${aclModule.name}'`,
      );

      if (!checkForExistingModule.length) {
        await queryRunner.query(
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
    }
  }

  computePermissions(addedPermissionList: {
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
  private async seedCertificateSetting(queryRunner: QueryRunner) {
    const certificateSettingTable = await queryRunner.getTable(
      'public.certificate_setting',
    );

    if (!certificateSettingTable) {
      this.logger.verbose('certificate_setting table does not exist.');
      return;
    }
    queryRunner.query(
      `INSERT INTO public.certificate_setting ("id","no_of_days") VALUES (
             1,60)`,
    );
  }
}
