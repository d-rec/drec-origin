import { FC } from 'react';
import { DisabledFormView } from '@energyweb/origin-ui-core';
import { Box, CircularProgress } from '@mui/material';
import { useYieldConfigEffects } from './YieldConfogPage.effecs';
import { useStyles } from './YieldConfigPage.styles';
import { TableComponent } from '@energyweb/origin-ui-core';
export const YieldConfigViewPage: FC = () => {


    const tableProps = useYieldConfigEffects();

    return <TableComponent {...tableProps} />;
};
