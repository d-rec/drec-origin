import { addDecorator } from '@storybook/react';
import { createTheme, ThemeProvider as MuiThemeProvider } from '@material-ui/core';
import { MemoryRouter } from 'react-router';
import { QueryClient, QueryClientProvider } from 'react-query';
import { themeOptions } from '../src/utils/styling';

const theme = createTheme(themeOptions);
const queryClient = new QueryClient();

addDecorator((story) => <MemoryRouter initialEntries={['/']}>{story()}</MemoryRouter>);
addDecorator((story) => <MuiThemeProvider theme={theme}>{story()}</MuiThemeProvider>);
addDecorator((story) => <QueryClientProvider client={queryClient}>{story()}</QueryClientProvider>);

export const parameters = {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
        matchers: {
            color: /(background|color)$/i,
            date: /Date$/
        }
    }
};
