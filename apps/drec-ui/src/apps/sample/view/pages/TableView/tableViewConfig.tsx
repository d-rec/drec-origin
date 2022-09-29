import React, { FC } from 'react';
import { useStyles } from './tableViewConfig.style';
import { Paper } from '@mui/material';
// import { GenericForm } from '@energyweb/origin-ui-core';
// //import { usesamplePageEffects } from './FromViewConfig.effect';

export const AddSampleListViewPage: FC = () => {
    const classes = useStyles();
    return (
        <Paper className={classes.paper}>
            <table>
                <tr>
                    <td>Cell 1</td>
                    <td>Cell 2</td>
                    <td>Cell 3</td>
                </tr>
                <tr>
                    <td>Cell 4</td>
                    <td>Cell 5</td>
                    <td>Cell 6</td>
                </tr>
            </table>

        </Paper>

    );
};