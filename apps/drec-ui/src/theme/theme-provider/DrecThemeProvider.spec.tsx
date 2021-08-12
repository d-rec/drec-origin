import React from 'react';
import { render } from '@testing-library/react';

import { DrecThemeProvider } from './DrecThemeProvider';

describe('ThemeProvider', () => {
    it('should render successfully', () => {
        const { baseElement } = render(<DrecThemeProvider children={null} />);
        expect(baseElement).toBeTruthy();
    });
});
