import { LightenColor } from '@energyweb/origin-ui-theme';
import { makeStyles } from '@material-ui/styles';

export const useStyles = makeStyles((theme) => ({
    specsWrapper: {
        marginBottom: theme.spacing(1.5),
        color: '#fff'
    },
    specFieldWrapper: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '20px'
    },
    icon: {
        width: 25,
        fill: LightenColor(theme.palette.text.secondary, -7, theme.palette.mode)
    }
}));
