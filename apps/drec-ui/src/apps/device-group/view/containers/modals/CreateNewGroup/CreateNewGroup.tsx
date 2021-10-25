import { Dialog, DialogContent } from '@material-ui/core';
import { FC } from 'react';
import { useCreateNewGroupEffects } from './CreateNewGroup.effects';
import { GenericForm } from '@energyweb/origin-ui-core';

export const CreateNewGroup: FC = () => {
    const { formProps, isOpen, handleModalClose } = useCreateNewGroupEffects();

    return (
        <Dialog open={isOpen} onClose={handleModalClose} maxWidth="sm">
            <DialogContent>
                <GenericForm {...formProps} />
            </DialogContent>
        </Dialog>
    );
};
