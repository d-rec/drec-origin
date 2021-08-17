import { ErrorFallback } from '../core';
import { Box, Button } from '@material-ui/core';
import React, { FC } from 'react';

interface CustomErrorFallbackProps {
    error: Error;
}

export const CustomErrorFallback: FC<CustomErrorFallbackProps> = ({ error }) => {
    const title = 'Something went wrong:';
    const reloadButton = 'Reload page';
    const returnHomeButton = 'Return to Home page';

    return (
        <ErrorFallback title={title} error={error}>
            <Box mt={2} display="flex" justifyContent="center">
                <Button variant="contained">{reloadButton}</Button>
                <Box ml={2}>
                    <Button variant="contained">{returnHomeButton}</Button>
                </Box>
            </Box>
        </ErrorFallback>
    );
};
