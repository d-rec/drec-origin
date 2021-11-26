import { makeStyles } from '@mui/styles';

export const useStyles = makeStyles((theme) => ({
    mapContainer: {
        width: '100%',
        height: '100%'
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
