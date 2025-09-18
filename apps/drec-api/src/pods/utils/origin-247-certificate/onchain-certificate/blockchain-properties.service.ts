import { Injectable } from '@nestjs/common';
import { Contracts, IBlockchainProperties } from '@energyweb/issuer';
import { providers, Signer, Wallet } from 'ethers';
import { getProviderWithFallback } from '@energyweb/utils-general';
import { getConfiguration } from './config/configuration';
import { DeploymentPropertiesRepository } from './repositories/deploymentProperties/deployment-properties.repository';
import { waitForState } from '../../../../types/utils/wait.utils';

export interface BlockchainProperties {
  rpcNode: string;
  fallbackRpcNode: string | null;
  registry: string;
  issuer: string;
}

@Injectable()
export class BlockchainPropertiesService {
  private readonly fallbackRPC: string | null;
  private readonly primaryRPC: string;
  private readonly issuerPrivateKey: string;

  constructor(private deploymentPropsRepo: DeploymentPropertiesRepository) {
    const { primaryRPC, fallbackRPC } = getConfiguration().WEB3;
    const issuerPrivateKey = getConfiguration().ISSUER_PRIVATE_KEY;

    this.primaryRPC = primaryRPC;
    this.issuerPrivateKey = issuerPrivateKey;
    this.fallbackRPC = fallbackRPC ? fallbackRPC : null;
  }

  async get(): Promise<BlockchainProperties> {
    await this.waitForPropertiesToBeDeployed();

    const { registry, issuer } = await this.deploymentPropsRepo.get();

    return {
      rpcNode: this.primaryRPC,
      fallbackRpcNode: this.fallbackRPC,
      issuer,
      registry,
    };
  }

  async getWrapped(): Promise<IBlockchainProperties> {
    await this.waitForPropertiesToBeDeployed();

    const { registry, issuer } = await this.deploymentPropsRepo.get();

    const web3 = getProviderWithFallback(
      ...[this.primaryRPC, this.fallbackRPC ?? ''].filter((url) =>
        Boolean(url),
      ),
    );

    const signer: Signer = new Wallet(
      this.assure0x(this.issuerPrivateKey),
      web3,
    );

    return {
      web3,
      registry: Contracts.factories.RegistryExtendedFactory.connect(
        registry,
        signer,
      ),
      issuer: Contracts.factories.IssuerFactory.connect(issuer, signer),
      activeUser: signer,
    };
  }

  async deploy(): Promise<void> {
    if (await this.deploymentPropsRepo.propertiesExist()) {
      return;
    }

    const provider = new providers.FallbackProvider([
      new providers.JsonRpcProvider(this.primaryRPC),
    ]);

    const registry = await Contracts.migrateRegistry(
      provider,
      this.issuerPrivateKey,
    );
    const issuer = await Contracts.migrateIssuer(
      provider,
      this.issuerPrivateKey,
      registry.address,
    );

    await this.deploymentPropsRepo.save({
      registry: registry.address,
      issuer: issuer.address,
    });
  }

  async isDeployed(): Promise<boolean> {
    return await this.deploymentPropsRepo.propertiesExist();
  }

  async wrap(privateKey: string): Promise<{
    web3: providers.Provider;
    registry: any;
    issuer: any;
    activeUser: Signer;
  }> {
    const { registry, issuer } = await this.deploymentPropsRepo.get();

    const { web3 } = await this.getWrapped();

    const signer: Signer = new Wallet(this.assure0x(privateKey), web3);
    return {
      web3,
      registry: Contracts.factories.RegistryExtendedFactory.connect(
        registry,
        signer,
      ),
      issuer: Contracts.factories.IssuerFactory.connect(issuer, signer),
      activeUser: signer,
    };
  }

  private assure0x = (privateKey: string) =>
    privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`;

  private async waitForPropertiesToBeDeployed() {
    await waitForState(
      async () => await this.isDeployed(),
      'Blockchain properties were not deployed',
      { interval: 5_000, maxTries: 24 },
    );
  }
}
