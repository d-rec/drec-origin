import { makeStyles } from '@mui/styles';

export const useStyles = makeStyles((theme) => ({
    headerWrapper: {
        display: 'flex',
        flexDirection: 'column'
    },
    buttonsWrapper: {
        display: 'flex',
        justifyContent: 'space-between',
        marginRight: 15
    },
    nameBlockWrapper: {
        width: '100%',
        paddingLeft: 15,
        paddingBottom: 15,
        [theme.breakpoints.down('sm')]: {
            paddingLeft: 0,
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            textAlign: 'center'
        }
    },
    attributesBlockWrapper: {
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        alignItems: 'start',
        gap: '10px',
        paddingBottom: 15
    },
    attributeSpecBlockWrapper: {
        width: '100%',
        display: 'flex',
        justifyContent: 'space-between',
        gap: '30px',
        [theme.breakpoints.down('lg')]: {
            flexDirection: 'column',
            gap: '10px'
        }
    },
    divider: {
        marginTop: 10
    },
    specBlockWrapper: {
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        alignItems: 'start',
        gap: '10px',
        [theme.breakpoints.down('sm')]: {
            width: '100%',
            justifyContent: 'center',
            paddingRight: 0
        }
    },
    button: {
        textTransform: 'none',
        fontSize: '0.8rem',
        paddingLeft: 5,
        paddingRight: 5
    },
    buttonEndIcon: {
        marginLeft: 0
    },
    specFieldGrid: {
        alignItems: 'center'
    },
    specFieldWrapper: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    specFieldValue: {
        color: theme.palette.text.primary,
        fontSize: '0.9rem',
        margin: '0 20px'
    }
}));
