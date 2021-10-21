import { makeStyles } from '@material-ui/styles';

export const useStyles = makeStyles((theme) => ({
    paper: {
        width: '100%',
        marginBottom: 20,
        padding: '20px'
    },
    dataWrapper: {
        width: '100%',
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'start',
        alignItems: 'center',
        gap: 20,
        [theme.breakpoints.down('lg')]: {
            flexDirection: 'column'
        }
    },
    devicesWrapper: {
        marginTop: 20,
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'start',
        alignItems: 'start',
        gap: 20
    },
    buttonsWrapper: {
        display: 'flex',
        justifyContent: 'start',
        alignItems: 'center',
        gap: 20,
        width: 'auto',
        [theme.breakpoints.down('lg')]: {
            width: '100%'
        }
    },
    autocomplete: {
        width: '60%',
        [theme.breakpoints.down('lg')]: {
            width: '100%'
        }
    }
}));
