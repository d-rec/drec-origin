import { makeStyles } from '@material-ui/styles';

export const useStyles = makeStyles((theme) => ({
    card: {
        height: '100%',
        minWidth: 435,
        flex: '1 1 0px'
    },
    icon: {
        width: 80,
        padding: 50,
        fill: theme.palette.primary.main
    }
}));
