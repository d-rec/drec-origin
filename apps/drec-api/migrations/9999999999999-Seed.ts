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
import { Logger } from '@nestjs/common';
// import UsersJSON from './users.json';
// import OrganizationsJSON from './organizations.json';
// import DevicesJSON from './devices.json';
const UsersJSON = [];
const OrganizationsJSON = [];
const DevicesJSON = [];

import RoleJSON from './user_role.json';
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

    // await this.seedOrganizations(queryRunner, registry);
    // await this.seedUsers(queryRunner);
    // await this.seedDevices(queryRunner);
    await this.seedUsersRole(queryRunner);
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

  private async seedUsers(queryRunner: QueryRunner) {
    const userTable = await queryRunner.getTable('public.user');

    if (!userTable) {
      this.logger.verbose('user table does not exist.');
      return;
    }

    await Promise.all(
      (UsersJSON as unknown as IUserSeed[]).map(async (user) => {
        queryRunner.query(
          `INSERT INTO public.user (
            "id", 
            "title", 
            "firstName", 
            "lastName", 
            "telephone", 
            "email", 
            password, 
            "notifications", 
            "status", 
            "role", 
            "organizationId"
            ) VALUES (
              '${user.id}', 
              '${user.title}', 
              '${user.firstName}', 
              '${user.lastName}', 
              '${user.telephone}', 
              '${user.email.toLowerCase()}', 
              '${user.password}', 
              '${user.notifications}', 
              '${user.status}', 
              '${user.role}', 
              '${user.organizationId}'
            )`,
        );
      }),
    );
  }

  private async seedOrganizations(
    queryRunner: QueryRunner,
    registryAddress: string,
  ) {
    const organizationsTable = await queryRunner.getTable(
      'public.organization',
    );

    if (!organizationsTable) {
      this.logger.verbose('organization table does not exist.');
      return;
    }

    for (const [index, organization] of (OrganizationsJSON as Array<any>)
      // OrganizationsJSON as IFullOrganization[]
      .entries()) {
      const [primaryRpc, fallbackRpc] = process.env.WEB3!.split(';');
      const provider = getProviderWithFallback(primaryRpc, fallbackRpc);
      const blockchainAccount = Wallet.fromMnemonic(
        process.env.MNEMONIC!,
        `m/44'/60'/0'/0/${index + 1}`,
      );

      const registryWithSigner =
        Contracts.factories.RegistryExtendedFactory.connect(
          registryAddress,
          new Wallet(blockchainAccount.privateKey, provider),
        );

      await registryWithSigner.setApprovalForAll(issuerAccount.address, true);

      // await queryRunner.query(
      //   `INSERT INTO public.organization (
      //     "id",
      //     "name",
      //     "address",
      //     "zipCode",
      //     "city",
      //     "country",
      //     "businessType",
      //     "tradeRegistryCompanyNumber",
      //     "vatNumber",
      //     status,
      //     "blockchainAccountAddress",
      //     "signatoryFullName",
      //     "signatoryAddress",
      //     "signatoryCity",
      //     "signatoryZipCode",
      //     "signatoryCountry",
      //     "signatoryEmail",
      //     "signatoryPhoneNumber"
      //   ) VALUES (
      //     '${organization.id}',
      //     '${organization.name}',
      //     '${organization.address}',
      //     '${organization.zipCode}',
      //     '${organization.city}',
      //     '${organization.country}',
      //     '${organization.businessType}',
      //     '${organization.tradeRegistryCompanyNumber}',
      //     '${organization.vatNumber}',
      //     '${organization.status}',
      //     '${blockchainAccount.address}',
      //     '${organization.signatoryFullName}',
      //     '${organization.signatoryAddress}',
      //     '${organization.signatoryCity}',
      //     '${organization.signatoryZipCode}',
      //     '${organization.signatoryCountry}',
      //     '${organization.signatoryEmail}',
      //     '${organization.signatoryPhoneNumber}'
      //   )`,
      // );
    }
  }

  /*
  private async seedDevices(queryRunner: QueryRunner) {
    const devicesTable = await queryRunner.getTable('public.device');

    if (!devicesTable) {
      console.log('device table does not exist.');
      return;
    }

    await Promise.all(
      (DevicesJSON as IDevice[]).map((device) =>
        queryRunner.query(
          `INSERT INTO public.device (
            "externalId", 
            "organizationId", 
            "projectName", 
            latitude, 
            longitude, 
            "fuelCode", 
            "deviceTypeCode", 
            "installationConfiguration", 
            capacity, 
            "commissioningDate", 
            "gridInterconnection", 
            "offTaker", 
            sector, 
            "standardCompliance", 
            "yieldValue", 
            labels, 
            "impactStory", 
            "countryCode"
          ) VALUES (
              '${device.externalId}', 
              '${device.organizationId}', 
              '${device.projectName}', 
              '${device.latitude}', 
              '${device.longitude}', 
              '${device.fuelCode}', 
              '${device.deviceTypeCode}', 
              '${device.installationConfiguration}', 
              '${device.capacity}', 
              '${device.commissioningDate}', 
              '${device.gridInterconnection}', 
              '${device.offTaker}', 
              '${device.sector}', 
              '${device.standardCompliance}', 
              '${device.yieldValue}', 
              '${device.labels}', 
              '${device.impactStory}', 
              '${device.countryCode}'
            )`,
        ),
      ),
    );
  }
  */

  private async seedBlockchain(
    queryRunner: QueryRunner,
  ): Promise<IContractsLookup> {
    const [primaryRpc, fallbackRpc] = process.env.WEB3!.split(';');
    const provider = getProviderWithFallback(primaryRpc, fallbackRpc);
    const contractsLookup = await this.deployContracts(issuerAccount, provider);

    if (provider && contractsLookup) {
      await queryRunner.query(
        `INSERT INTO public.issuer_blockchain_properties ("netId", "registry", "issuer", "rpcNode", "rpcNodeFallback", "platformOperatorPrivateKey") VALUES (${
          provider.network.chainId
        }, '${contractsLookup.registry}', '${
          contractsLookup.issuer
        }', '${primaryRpc}', '${fallbackRpc ?? ''}', '${
          issuerAccount.privateKey
        }')`,
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
            for (var key in addedPermissionList) {
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

  computePermissions(addedPermissionList: any) {
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
