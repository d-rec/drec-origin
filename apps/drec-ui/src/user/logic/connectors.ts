import { InjectedConnector } from '@web3-react/injected-connector';

const supportedNetworks = process.env.REACT_APP_SUPPORTED_NETWORK_IDS.split(';').map((id: string) =>
    Number(id)
);
export const injectedConnector = new InjectedConnector({
    supportedChainIds: supportedNetworks
});
