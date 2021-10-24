import { TCreateNewGroupFormLogic } from './types';
import * as yup from 'yup';

export const useCreateNewGroupFormLogic: TCreateNewGroupFormLogic = (handleClose, group) => {
    return {
        formTitle: 'Create New Device Group',
        formTitleVariant: 'h5',
        initialValues: {
            groupName: group?.name
        },
        fields: [
            {
                name: 'groupName',
                label: 'Group Name',
                required: true
            }
        ],
        validationMode: 'onSubmit',
        inputsVariant: 'filled',
        secondaryButtons: [
            {
                variant: 'contained',
                style: { marginRight: 20 },
                label: 'Cancel',
                onClick: handleClose
            }
        ],
        buttonText: 'Create New Group',
        validationSchema: yup.object({
            groupName: yup.string().label('Group Name').required()
        }),
        buttonDisabled: false
    };
};
