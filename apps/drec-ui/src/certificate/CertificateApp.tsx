import { PageNotFound } from '@energyweb/origin-ui-core';
import React, { FC } from 'react';
import { Route, Routes } from 'react-router-dom';
import {
    CertificateAppEnvProvider,
    CertificateEnvVariables,
    TransactionPendingProvider
} from './context';

export interface CertificateAppProps {
    routesConfig: {
        showExchangeInbox: boolean;
        showBlockchainInbox: boolean;
    };
    envVariables: CertificateEnvVariables;
}

export const CertificateApp: FC<CertificateAppProps> = ({ routesConfig, envVariables }) => {
    const { showExchangeInbox, showBlockchainInbox } = routesConfig;

    return (
        <CertificateAppEnvProvider variables={envVariables}>
            <Routes>
                <Route path="*" element={<PageNotFound />} />
            </Routes>
        </CertificateAppEnvProvider>
    );
};
