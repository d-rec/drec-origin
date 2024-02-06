import React, { FC } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import StyledEngineProvider from '@mui/material/StyledEngineProvider';
import makeDrecUiConfig from '../utils/makeDrecUiConfig';

export const DrecThemeProvider: FC = ({ children }) => {
    const configuration = makeDrecUiConfig();
    return (
        <StyledEngineProvider injectFirst>
            <ThemeProvider theme={configuration.materialTheme}>{children}</ThemeProvider>
        </StyledEngineProvider>
    );
};
