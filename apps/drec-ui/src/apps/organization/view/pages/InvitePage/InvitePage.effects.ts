import { GenericFormProps } from '@energyweb/origin-ui-core';
import { useMediaQuery, useTheme } from '@mui/material';
import { useOrganizationInviteHandler } from 'apps/organization/data';
import { InviteFormValues, useInviteFormLogic } from 'apps/organization/logic';

export const useInvitePageEffects = () => {
    const { fields, initialValues, validationSchema, buttonText } = useInviteFormLogic();

    const { submitHandler, apiLoading } = useOrganizationInviteHandler();

    const pageLoading = apiLoading;


    const formData: GenericFormProps<InviteFormValues> = {
        fields,
        initialValues,
        validationSchema,
        buttonText,
        //@ts-ignore
        submitHandler
    };

    const theme = useTheme();
    const mobileView = useMediaQuery(theme.breakpoints.down('sm'));

    return { formData, pageLoading, mobileView };
};
