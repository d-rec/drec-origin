import React, { FC } from 'react';
import { TableComponent, Requirements } from '@energyweb/origin-ui-core';
import { useRedemptionReportPageEffects } from './RedemptionReportPage.effects';

export const RedemptionReportPage: FC = () => {
    const { tableData, canAccessPage, requirementsProps } = useRedemptionReportPageEffects();

    if (!canAccessPage) {
        return <Requirements {...requirementsProps} />;
    }

    return <TableComponent {...tableData} />;
};

export default RedemptionReportPage;
