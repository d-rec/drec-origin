import { Paper, Typography } from '@mui/material';
import { OrganizationBlockchainAddress } from '../OrganizationBlockchainAddress';
import { useStyles } from './BlockchainAddressesContainer.styles';
import { withMetamask } from 'utils';

const Component = () => {
    const classes = useStyles();
    return (
        <Paper classes={{ root: classes.paper }}>
            <Typography variant="h5">Blockchain Addresses</Typography>
            <OrganizationBlockchainAddress />
        </Paper>
    );
};

export const BlockchainAddressesContainer = withMetamask(Component);
