import { LightenColor } from '@energyweb/origin-ui-theme';
import { makeStyles } from '@mui/styles';

export const useStyles = makeStyles((theme) => ({
    contentWrapper: {
        display: 'flex',
        [theme.breakpoints.down('md')]: {},
        [theme.breakpoints.down('sm')]: {
            paddingBottom: 10
        }
    },
    iconWrapper: {
        width: '50%',
        [theme.breakpoints.down('md')]: {
            width: '50%'
        },
        [theme.breakpoints.down('sm')]: {
            width: '50%'
        }
    },
    deviceGroupIcon: {
        width: 40,
        fill: LightenColor(theme.palette.text.secondary, -7, theme.palette.mode)
    }
}));
