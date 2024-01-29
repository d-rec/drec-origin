import { LightenColor } from '@energyweb/origin-ui-theme';
import { makeStyles } from '@mui/styles';

export const useStyles = makeStyles((theme) => ({
    specsWrapper: {
        marginBottom: theme.spacing(1.5)
    },
    specFieldWrapper: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '30px',
        fontSize: '0.9rem',
        marginBottom: '10px'
    },
    specFieldValue: {
        fontSize: '0.9rem'
    },
    contentWrapper: {
        display: 'flex'
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
    icon: {
        width: 25,
        fill: LightenColor(theme.palette.text.secondary, -7, theme.palette.mode)
    }
}));
