import { LightenColor } from '@energyweb/origin-ui-theme';
import { makeStyles } from '@mui/styles';

export const useStyles = makeStyles((theme) => ({
    wrapper: {
        margin: '15px 0',
        padding: '0 20px',
        display: 'flex',
        width: 'calc(100% -20px)',
        borderTop: `1px solid ${LightenColor(
            theme.palette.background.paper,
            15,
            theme.palette.mode
        )}`,
        borderBottom: `1px solid ${LightenColor(
            theme.palette.background.paper,
            15,
            theme.palette.mode
        )}`,
        [theme.breakpoints.down('lg')]: {
            padding: 0
        },
        [theme.breakpoints.down('md')]: {
            flexDirection: 'column'
        }
    },
    owner: {
        color: theme.palette.text.secondary
    },
    country: {
        marginLeft: '30px'
    }
}));
