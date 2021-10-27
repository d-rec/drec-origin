import { makeStyles } from '@material-ui/styles';

export const useStyles = makeStyles((theme) => ({
    wrapper: {
        width: '100%',
        position: 'relative',
        minHeight: '350px'
    },
    deviceGroupName: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        zIndex: 2,
        [theme.breakpoints.up('lg')]: {
            fontSize: 26
        },
        [theme.breakpoints.down('lg')]: {
            fontSize: 24,
            left: 10,
            bottom: 10
        },
        [theme.breakpoints.down('md')]: {
            fontSize: 22,
            left: 10,
            bottom: 5
        },
        [theme.breakpoints.down('sm')]: {
            fontSize: 20
        }
    }
}));
