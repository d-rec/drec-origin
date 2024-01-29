import { QueryClient, QueryClientProvider } from 'react-query';
import React, { ReactElement } from 'react';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: false,
            refetchOnWindowFocus: false,
            onError: (error) => {
                console.error(error);
            }
        }
    }
});

export const DrecQueryClientProvider = ({ children }: { children: ReactElement }) => {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};
