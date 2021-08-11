import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { DrecThemeProvider } from './theme';
import { App } from './App';

import './index.css';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: false,
            refetchOnWindowFocus: false,
            onError: (error) => {
                console.log(error);
            }
        }
    }
});

ReactDOM.render(
    <React.StrictMode>
        <DrecThemeProvider>
            <BrowserRouter>
                <QueryClientProvider client={queryClient}>
                    <App />
                </QueryClientProvider>
            </BrowserRouter>
        </DrecThemeProvider>
    </React.StrictMode>,
    document.getElementById('root')
);
