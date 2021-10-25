import { GenericModal } from '@energyweb/origin-ui-core';
import { FC } from 'react';
import { useDeleteDeviceGroupEffects } from './DeleteDeviceGroup.effects';

export const DeleteDeviceGroup: FC = () => {
    const { open, title, text, buttons, dialogProps } = useDeleteDeviceGroupEffects();

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
