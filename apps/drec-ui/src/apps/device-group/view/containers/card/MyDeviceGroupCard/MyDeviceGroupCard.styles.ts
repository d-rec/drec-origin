import { makeStyles } from '@mui/styles';

export const useStyles = makeStyles((theme) => ({
    card: {
        maxWidth: '1000px'
    },
    fallbackIconWrapper: {
        width: 70
    },
    fallbackIcon: {
        fill: theme.palette.primary.main
    }
}));
