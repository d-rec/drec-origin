import { FC } from 'react';
import { Paper, Typography } from '@material-ui/core';
import { useStyles } from './NoItems.styles';

export interface NoItemsProps {
    title: string;
}

export const NoItems: FC<NoItemsProps> = ({ title }) => {
    const classes = useStyles();

    return (
        <Paper className={classes.paper}>
            <Typography textAlign="center" variant="h6">
                {title}
            </Typography>
        </Paper>
    );
};
