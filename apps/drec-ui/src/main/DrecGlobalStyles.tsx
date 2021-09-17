import React, { FC } from 'react';
import { Global, css } from '@emotion/react';
import { variables } from '../theme/config/variables';

export const DrecGlobalStyles: FC = () => {
    return (
        <Global
            styles={css({
                body: {
                    backgroundColor: variables.bodyBackgroundColor,
                    margin: 0
                }
            })}
        />
    );
};
