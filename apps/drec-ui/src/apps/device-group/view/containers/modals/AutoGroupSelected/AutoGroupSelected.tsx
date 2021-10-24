import { GenericModal } from '@energyweb/origin-ui-core';
import { FC } from 'react';
import { useAutoGroupSelectedEffects } from './AutoGroupSelected.effects';

export const AutoGroupSelected: FC = () => {
    const { open, title, text, buttons, dialogProps } = useAutoGroupSelectedEffects();

    return (
        <GenericModal
            open={open}
            title={title}
            text={text}
            buttons={buttons}
            dialogProps={dialogProps}
        />
    );
};
