import { Typography } from '@material-ui/core';
import { OrganizationBlockchainAddress } from '../OrganizationBlockchainAddress';

export const BlockchainAddressesContainer = () => {
    return (
        <>
            <Typography variant="h5">Blockchain Addresses</Typography>
            <OrganizationBlockchainAddress />
        </>
    );
};

export default BlockchainAddressesContainer;
