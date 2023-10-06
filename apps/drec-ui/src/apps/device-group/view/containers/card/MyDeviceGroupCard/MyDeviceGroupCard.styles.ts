import { makeStyles } from '@mui/styles';

export const useStyles = makeStyles((theme) => ({
    card: {
        width: '100%',
        marginBottom: 24
    },
    fallbackIconWrapper: {
        width: 70
    },
    fallbackIcon: {
        fill: theme.palette.primary.main
    }
}));
