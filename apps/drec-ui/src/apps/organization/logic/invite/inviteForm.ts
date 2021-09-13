import { Role } from '@energyweb/origin-drec-api-client';
import { GenericFormProps } from '@energyweb/origin-ui-core';
import * as yup from 'yup';
import { roleNamesInvitePage } from 'utils';

export type InviteFormValues = {
    email: string;
    role: Role;
};

type TUseInviteFormLogic = () => Omit<GenericFormProps<InviteFormValues>, 'submitHandler'>;

export const useInviteFormLogic: TUseInviteFormLogic = () => {
    return {
        initialValues: {
            email: '',
            role: Role.OrganizationUser
        },
        validationSchema: yup.object({
            email: yup.string().email().required().label('Email')
        }),
        fields: [
            {
                name: 'email',
                label: 'Email'
            },
            {
                name: 'role',
                label: 'Role',
                select: true,
                options: roleNamesInvitePage()
            }
        ],
        buttonText: 'Invite'
    };
};
