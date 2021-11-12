import { GenericModal } from '@energyweb/origin-ui-core';
import { FC } from 'react';
import { useUnreserveSelectedEffects } from './UnreserveSelected.effects';

export const UnreserveSelected: FC = () => {
    const { open, text, buttons, dialogProps } = useUnreserveSelectedEffects();

    return <GenericModal open={open} text={text} buttons={buttons} dialogProps={dialogProps} />;
};
