import { makeStyles } from '@mui/styles';

const drawerWidth = 360;

export const useStyles = makeStyles((theme) => ({
    wrapper: {
        display: 'flex',
        flexDirection: 'column'
    },
    drawerPaper: {
        width: drawerWidth,
        border: 'none',
        [theme.breakpoints.down('md')]: {
            marginTop: 0,
            width: '100%'
        }
    },
    content: {
        transition: theme.transitions.create('margin', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen
        })
    }
}));
