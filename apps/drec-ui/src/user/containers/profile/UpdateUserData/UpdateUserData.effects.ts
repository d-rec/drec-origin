import { useApiUpdateUserAccountData } from '../../../../api';
import { UserDTO } from '@energyweb/origin-drec-api-client';
import * as Yup from 'yup';

export type TUpdateUserDataFormValues = {
    firstName: UserDTO['firstName'];
    lastName: UserDTO['lastName'];
    telephone: UserDTO['telephone'];
    status: UserDTO['status'];
};

export const useUpdateUserDataEffects = (user: UserDTO) => {
    const { firstName, lastName, telephone, status } = user;
    const initialFormData: TUpdateUserDataFormValues = {
        firstName,
        lastName,
        telephone,
        status
    };
    const formConfig = {
        buttonText: 'Edit',
        fields: [
            {
                label: 'First name',
                name: 'firstName',
                required: true
            },
            {
                label: 'Last name',
                name: 'lastName',
                required: true
            },
            {
                label: 'Telephone',
                name: 'telephone',
                required: true
            },
            {
                label: 'Status',
                name: 'status',
                textFieldProps: { disabled: true }
            }
        ],
        buttonWrapperProps: { justifyContent: 'flex-start' },
        initialValues: initialFormData,
        twoColumns: true,
        inputsVariant: 'filled' as any,
        validationSchema: Yup.object().shape({
            firstName: Yup.string().label('First name').required(),
            lastName: Yup.string().label('Last name').required(),
            telephone: Yup.string().min(10).label('Telephone').required()
        })
    };
    const { submitHandler } = useApiUpdateUserAccountData();

    const formProps = {
        ...formConfig,
        submitHandler
    };

    return { formProps };
};
