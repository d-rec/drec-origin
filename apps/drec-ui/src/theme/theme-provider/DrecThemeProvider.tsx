import React, { FC } from 'react';
import { ThemeProvider } from '@material-ui/core/styles';
import StyledEngineProvider from '@material-ui/core/StyledEngineProvider';
import makeDrecUiConfig from '../utils/makeDrecUiConfig';

export const DrecThemeProvider: FC = ({ children }) => {
    const configuration = makeDrecUiConfig();
    return (
        <StyledEngineProvider injectFirst>
            <ThemeProvider theme={configuration.materialTheme}>
                {children}
            </ThemeProvider>
        </StyledEngineProvider>
    );
};
