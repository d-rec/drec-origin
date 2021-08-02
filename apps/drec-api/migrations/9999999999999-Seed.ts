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

import { IUser } from '../src/pods/user/user.entity';
import { IOrganization } from '../src/pods/organization/organization.entity';
import { IDevice } from '../src/pods/device';

import UsersJSON from './users.json';
import OrganizationsJSON from './organizations.json';
import DevicesJSON from './devices.json';

require('dotenv').config({ path: '../../../.env' });

const issuerAccount = Wallet.fromMnemonic(
  process.env.MNEMONIC!,
  `m/44'/60'/0'/0/${0}`,
); // Index 0 account

export class Seed9999999999999 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    const { registry } = await this.seedBlockchain(queryRunner);

    await this.seedUsers(queryRunner);
    await this.seedOrganizations(queryRunner, registry);
    await this.seedDevices(queryRunner);
  }

  public async down(queryRunner: QueryRunner): Promise<any> {}

  private async seedUsers(queryRunner: QueryRunner) {
    const userTable = await queryRunner.getTable('public.user');

    if (!userTable) {
      console.log('user table does not exist.');
      return;
    }

    await Promise.all(
      (UsersJSON as IUser[]).map((user) =>
        queryRunner.query(
          `INSERT INTO public.user (id, "username", "email", password, "organizationId") VALUES (${user.id}, '${user.username}', '${user.email}', '${user.password}', '${user.organizationId}')`,
        ),
      ),
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
      console.log('organization table does not exist.');
      return;
    }

    for (const [index, organization] of (
      OrganizationsJSON as IOrganization[]
    ).entries()) {
      const [primaryRpc, fallbackRpc] = process.env.WEB3!.split(';');
      const provider = getProviderWithFallback(primaryRpc, fallbackRpc);
      const blockchainAccount = Wallet.fromMnemonic(
        process.env.MNEMONIC!,
        `m/44'/60'/0'/0/${index + 1}`,
      );

      const registryWithSigner = Contracts.factories.RegistryFactory.connect(
        registryAddress,
        new Wallet(blockchainAccount.privateKey, provider),
      );

      await registryWithSigner.setApprovalForAll(issuerAccount.address, true);

      await queryRunner.query(
        `INSERT INTO public.organization (code, name, address, "primaryContact", telephone, email, "regNumber", "vatNumber", "regAddress", "country", "blockchainAccountAddress", "role") VALUES ('${organization.code}', '${organization.name}', '${organization.address}', '${organization.primaryContact}', '${organization.telephone}', '${organization.email}', '${organization.regNumber}', '${organization.vatNumber}', '${organization.regAddress}', '${organization.country}', '${blockchainAccount.address}', '${organization.role}')`,
      );
    }
  }

  private async seedDevices(queryRunner: QueryRunner) {
    const devicesTable = await queryRunner.getTable('public.device');

    if (!devicesTable) {
      console.log('device table does not exist.');
      return;
    }

    await Promise.all(
      (DevicesJSON as IDevice[]).map((device) =>
        queryRunner.query(
          `INSERT INTO public.device (id, "drecID", registrant_organisation_code, project_name, address, latitude, longitude, fuel_code, device_type_code, installation_configuration, capacity, commissioning_date, grid_interconnection, off_taker, sector, standard_compliance, yield_value, labels, impact_story, country_code) VALUES ('${device.id}', '${device.drecID}', '${device.registrant_organisation_code}', '${device.project_name}', '${device.address}', '${device.latitude}', '${device.longitude}', '${device.fuel_code}', '${device.device_type_code}', '${device.installation_configuration}', '${device.capacity}', '${device.commissioning_date}', '${device.grid_interconnection}', '${device.off_taker}', '${device.sector}', '${device.standard_compliance}', '${device.yield_value}', '${device.labels}', '${device.impact_story}', '${device.country_code}')`,
        ),
      ),
    );
  }

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
}
