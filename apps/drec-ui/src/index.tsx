import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter } from 'react-router-dom';
import { ErrorBoundary } from 'react-error-boundary';
import { Web3ReactProvider } from '@web3-react/core';
import { getLibrary } from 'utils';
import { DrecThemeProvider } from './theme/theme-provider';
import { CustomErrorFallback, DrecQueryClientProvider, AppContainer } from './main';

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
