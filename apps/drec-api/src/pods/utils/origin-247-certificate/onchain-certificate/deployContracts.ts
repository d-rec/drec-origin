import { Contracts } from '@energyweb/issuer';
import { providers } from 'ethers';
import { DeploymentProperties } from './types';
import { DeployParameters } from '../../../../types/utils/deploy';

export interface DeploymentPropertiesWithQuery extends DeploymentProperties {
  insertQuery: string;
}

export async function deployContracts(
  web3: string,
  issuerPrivateKey: string,
): Promise<DeploymentPropertiesWithQuery> {
  const provider = new providers.FallbackProvider([
    new providers.JsonRpcProvider(web3),
  ]);

  const registry = await Contracts.migrateRegistry(provider, issuerPrivateKey);
  const issuer = await Contracts.migrateIssuer(
    provider,
    issuerPrivateKey,
    registry.address,
  );

  return {
    registry: registry.address,
    issuer: issuer.address,
    insertQuery: `INSERT INTO certificate_deployment_properties VALUES ('${registry.address}', '${issuer.address}');`,
  };
}

export function getSelectDeploymentPropertiesQuery(): string {
  return `SELECT * FROM certificate_deployment_properties;`;
}
