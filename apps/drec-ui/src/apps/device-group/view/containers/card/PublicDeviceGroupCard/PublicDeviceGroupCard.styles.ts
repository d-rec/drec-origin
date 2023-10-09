import { makeStyles } from '@mui/styles';

export const useStyles = makeStyles((theme) => ({
    card: {
        height: '100%',
        width: 430,
        flex: '1 1 0px'
    },
    icon: {
        width: 80,
        padding: 50,
        fill: theme.palette.primary.main
    }
}));
