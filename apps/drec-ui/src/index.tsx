import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter } from 'react-router-dom';
import { ErrorBoundary } from 'react-error-boundary';
import { DrecThemeProvider } from './theme';
import { CustomErrorFallback, DrecQueryClientProvider } from './main';
import { AppContainer } from './AppContainer';

import './index.css';

ReactDOM.render(
    <React.StrictMode>
        <DrecThemeProvider>
            <ErrorBoundary FallbackComponent={CustomErrorFallback}>
                <BrowserRouter>
                    <DrecQueryClientProvider>
                        <AppContainer />
                    </DrecQueryClientProvider>
                </BrowserRouter>
            </ErrorBoundary>
        </DrecThemeProvider>
    </React.StrictMode>,
    document.getElementById('root')
);
