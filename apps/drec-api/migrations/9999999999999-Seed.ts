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

import { IFullOrganization, IDevice, IUserSeed } from '../src/models';

import UsersJSON from './users.json';
import OrganizationsJSON from './organizations.json';
import DevicesJSON from './devices.json';

// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config({ path: '../../../.env' });

const issuerAccount = Wallet.fromMnemonic(
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  process.env.MNEMONIC!,
  `m/44'/60'/0'/0/${0}`,
); // Index 0 account

export class Seed9999999999999 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    const { registry } = await this.seedBlockchain(queryRunner);

    await this.seedOrganizations(queryRunner, registry);
    await this.seedUsers(queryRunner);
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
      (UsersJSON as unknown as IUserSeed[]).map((user) =>
        queryRunner.query(
          `INSERT INTO public.user (
            id, 
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
              ${user.id}, 
              '${user.title}', 
              '${user.firstName}', 
              '${user.lastName}', 
              '${user.telephone}', 
              '${user.email}', 
              '${user.password}', 
              '${user.notifications}', 
              '${user.status}', 
              '${user.role}', 
              '${user.organizationId}'
            )`,
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
      OrganizationsJSON as IFullOrganization[]
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
        `INSERT INTO public.organization (
          id,
          "name",
          "address",
          "zipCode",
          "city",
          "country",
          "businessType",
          "tradeRegistryCompanyNumber",
          "vatNumber",
          status,
          "blockchainAccountAddress",
          "signatoryFullName",
          "signatoryAddress",
          "signatoryCity",
          "signatoryZipCode",
          "signatoryCountry",
          "signatoryEmail",
          "signatoryPhoneNumber"
        ) VALUES (
          '${organization.id}', 
          '${organization.name}', 
          '${organization.address}', 
          '${organization.zipCode}', 
          '${organization.city}', 
          '${organization.country}', 
          '${organization.businessType}', 
          '${organization.tradeRegistryCompanyNumber}', 
          '${organization.vatNumber}', 
          '${organization.status}', 
          '${blockchainAccount.address}', 
          '${organization.signatoryFullName}', 
          '${organization.signatoryAddress}', 
          '${organization.signatoryCity}', 
          '${organization.signatoryZipCode}', 
          '${organization.signatoryCountry}', 
          '${organization.signatoryEmail}', 
          '${organization.signatoryPhoneNumber}'
        )`,
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
          `INSERT INTO public.device (
            id, 
            "drecID", 
            "organizationId", 
            "projectName", 
            address, 
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
              '${device.id}', 
              '${device.drecID}', 
              '${device.organizationId}', 
              '${device.projectName}', 
              '${device.address}', 
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
