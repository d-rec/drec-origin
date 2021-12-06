import { useParams } from 'react-router';
import { useAdminUpdateOrganizationFormLogic } from 'apps/user/logic';
import { useAdminGetOrganization, useAdminUpdateOrganization } from '../../../data';

export const useAdminUpdateOrganizationPageEffects = () => {
    const { id } = useParams();
    const { organization, isLoading } = useAdminGetOrganization(id);
    const submitHandler = useAdminUpdateOrganization(id);
    const formConfig = useAdminUpdateOrganizationFormLogic(organization);

    const formProps = {
        ...formConfig,
        submitHandler
    };

    return { formProps, isLoading };
};
