import { makeStyles } from '@mui/styles';

export const useStyles = makeStyles({
    wrapper: {
        width: '100%',
        display: 'flex',
        padding: '20px',
        alignItems: 'center',
        flexDirection: 'column',
        gap: 20
    },
    paper: {
        width: '100%',
        marginBottom: 20,
        padding: '20px'
    },
    dataWrapper: {
        width: '100%',
        padding: 20
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
        width: '100%',
        display: 'flex',
        justifyContent: 'end',
        marginTop: 20
    }
});
