import React from 'react';
import { Paper, Typography } from '@material-ui/core';
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
