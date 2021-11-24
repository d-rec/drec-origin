import { LightenColor } from '@energyweb/origin-ui-theme';
import { makeStyles } from '@material-ui/styles';

export const useStyles = makeStyles((theme) => ({
    wrapper: {
        margin: '15px 0',
        padding: '0 20px',
        display: 'flex',
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
        width: '100%',
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
