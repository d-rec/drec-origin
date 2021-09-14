import { LightenColor } from 'theme';
import { makeStyles } from '@material-ui/core';

export const useStyles = makeStyles((theme) => ({
    specsWrapper: {
        marginBottom: theme.spacing(1.5),
        color: '#fff'
    },
    icon: {
        width: 25,
        fill: LightenColor(theme.palette.text.secondary, -7, theme.palette.mode)
    }
}));
