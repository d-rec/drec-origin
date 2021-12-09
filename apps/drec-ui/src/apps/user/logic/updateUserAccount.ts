import { UserDTO } from '@energyweb/origin-drec-api-client';
import { GenericFormProps } from '@energyweb/origin-ui-core';
import * as Yup from 'yup';
import { TITLE_OPTIONS } from '../../../utils';

type TUpdateUserDataFormValues = {
    title: UserDTO['title'];
    firstName: UserDTO['firstName'];
    lastName: UserDTO['lastName'];
    telephone: UserDTO['telephone'];
    status: UserDTO['status'];
    emailConfirmed: string;
};

export const useUpdateUserAccountDataFormConfig = (
    user: UserDTO
): Omit<GenericFormProps<TUpdateUserDataFormValues>, 'submitHandler'> => {
    const { title, firstName, lastName, telephone, status, emailConfirmed } = user;
    const initialFormData: TUpdateUserDataFormValues = {
        title,
        firstName,
        lastName,
        telephone,
        status,
        emailConfirmed: emailConfirmed ? 'Yes' : 'No'
    };
    return {
        buttonText: 'Save',
        fields: [
            {
                label: 'Title',
                name: 'title',
                select: true,
                options: TITLE_OPTIONS,
                additionalInputProps: {
                    valueToOpen: 'Other',
                    name: 'titleInput',
                    label: 'Title',
                    required: true
                }
            },
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
                name: 'telephone'
            },
            {
                label: 'Status',
                name: 'status',
                textFieldProps: { disabled: true }
            },
            {
                label: 'Email confirmed',
                name: 'emailConfirmed',
                textFieldProps: { disabled: true }
            }
        ],
        buttonWrapperProps: { justifyContent: 'flex-start' },
        initialValues: initialFormData,
        twoColumns: true,
        inputsVariant: 'filled' as any,
        validationSchema: Yup.object().shape({
            firstName: Yup.string().label('First name').required(),
            lastName: Yup.string().label('Last name').required()
        })
    };
};
