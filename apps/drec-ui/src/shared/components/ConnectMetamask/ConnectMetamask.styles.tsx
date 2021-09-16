import { makeStyles } from '@material-ui/core';

export const useStyles = makeStyles((theme) => ({
    paper: {
        padding: 20,
        textAlign: 'center',
        [theme.breakpoints.down('sm')]: {
            padding: 10
        }
    }
}));
