import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter } from 'react-router-dom';
import { ErrorBoundary } from 'react-error-boundary';
import { DrecThemeProvider } from './theme';
import { Web3ReactProvider } from '@web3-react/core';
import { CustomErrorFallback, DrecQueryClientProvider } from './main';
import { AppContainer } from './AppContainer';
import { getLibrary } from './user';

import './index.css';

ReactDOM.render(
    <React.StrictMode>
        <DrecThemeProvider>
            <ErrorBoundary FallbackComponent={CustomErrorFallback}>
                <BrowserRouter>
                    <Web3ReactProvider getLibrary={getLibrary}>
                        <DrecQueryClientProvider>
                            <AppContainer />
                        </DrecQueryClientProvider>
                    </Web3ReactProvider>
                </BrowserRouter>
            </ErrorBoundary>
        </DrecThemeProvider>
    </React.StrictMode>,
    document.getElementById('root')
);
