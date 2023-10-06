import { makeStyles } from '@mui/styles';

export const useStyles = makeStyles((theme) => ({
    wrapper: {
        width: '100%',
        position: 'relative',
        minHeight: 500
    },
    indicatorContainer: {
        position: 'absolute',
        textAlign: 'left',
        maxWidth: 150,
        [theme.breakpoints.up('lg')]: {
            left: 250,
            bottom: 25
        },
        [theme.breakpoints.down('lg')]: {
            left: 225,
            bottom: 15
        },
        [theme.breakpoints.down('md')]: {
            left: 200,
            bottom: 10
        },
        [theme.breakpoints.down('sm')]: {
            maxWidth: 100,
            left: 180
        }
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
    },
    map: {
        width: '100%',
        [theme.breakpoints.up('lg')]: {
            height: 420
        },
        [theme.breakpoints.down('lg')]: {
            height: 280
        },
        [theme.breakpoints.down('md')]: {
            height: 250
        },
        [theme.breakpoints.down('sm')]: {
            height: 230
        },
        objectFit: 'cover',
        borderRadius: 5
    }
}));
