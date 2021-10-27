import { PageNotFound } from '@energyweb/origin-ui-core';
import React, { FC } from 'react';
import { Route, Routes } from 'react-router-dom';
import {
    CertificateAppEnvProvider,
    CertificateEnvVariables,
    TransactionPendingProvider
} from './context';
import { BlockchainInboxPage, DetailViewPage } from './pages';

export interface CertificateAppProps {
    routesConfig: {
        showBlockchainInbox: boolean;
    };
    envVariables: CertificateEnvVariables;
}

export const CertificateApp: FC<CertificateAppProps> = ({ routesConfig, envVariables }) => {
    const { showBlockchainInbox } = routesConfig;

    return (
        <CertificateAppEnvProvider variables={envVariables}>
            <Routes>
                {showBlockchainInbox && (
                    <Route
                        path="blockchain-inbox"
                        element={
                            <TransactionPendingProvider>
                                <BlockchainInboxPage />
                            </TransactionPendingProvider>
                        }
                    />
                )}
                <Route path="detail-view/:id" element={<DetailViewPage />} />
                <Route path="*" element={<PageNotFound />} />
            </Routes>
        </CertificateAppEnvProvider>
    );
};
