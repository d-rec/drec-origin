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

import UsersJSON from './users.json';
import OrganizationsJSON from './organizations.json';

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

  private async seedBlockchain(
    queryRunner: QueryRunner,
  ): Promise<IContractsLookup> {
    const [primaryRpc, fallbackRpc] = process.env.WEB3!.split(';');
    const provider = getProviderWithFallback(primaryRpc, fallbackRpc);
    const contractsLookup = await this.deployContracts(issuerAccount, provider);

    await queryRunner.query(
      `INSERT INTO public.issuer_blockchain_properties ("netId", "registry", "issuer", "rpcNode", "rpcNodeFallback", "platformOperatorPrivateKey") VALUES (${
        provider.network.chainId
      }, '${contractsLookup.registry}', '${
        contractsLookup.issuer
      }', '${primaryRpc}', '${fallbackRpc ?? ''}', '${
        issuerAccount.privateKey
      }')`,
    );

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
