import { GenericModal } from '@energyweb/origin-ui-core';
import { FC } from 'react';
import { useReserveSelectedEffects } from './ReserveSelected.effects';

export const ReserveSelected: FC = () => {
    const { open, text, buttons, dialogProps } = useReserveSelectedEffects();

    return <GenericModal open={open} text={text} buttons={buttons} dialogProps={dialogProps} />;
};
