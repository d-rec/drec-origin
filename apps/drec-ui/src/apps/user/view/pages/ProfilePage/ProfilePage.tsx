import { CircularProgress, Paper, Box } from '@mui/material';
import { UserStatus } from '@energyweb/origin-drec-api-client';
import {
    BlockchainAddressesContainer,
    UpdateUserData,
    UpdateUserEmail,
    UpdateUserPassword
} from '../../containers';
import { useStyles } from './ProfilePage.styles';
import { useProfilePageEffects } from './ProfilePage.effects';

export const ProfilePage = () => {
    const classes = useStyles();
    const { user, userLoading } = useProfilePageEffects();

    if (userLoading) {
        return <CircularProgress />;
    }

    return (
        <Box width="100%">
            <Paper classes={{ root: classes.paper }}>
                <UpdateUserData userAccountData={user} />
            </Paper>
            <Paper classes={{ root: classes.paper }}>
                <UpdateUserEmail userAccountData={user} />
            </Paper>
            <Paper classes={{ root: classes.paper }}>
                <UpdateUserPassword />
            </Paper>
            {user.status === UserStatus.Active ? <BlockchainAddressesContainer /> : null}
        </Box>
    );
};
