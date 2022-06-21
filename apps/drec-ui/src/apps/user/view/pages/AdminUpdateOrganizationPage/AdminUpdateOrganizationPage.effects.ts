import { useParams } from 'react-router';
import {
    useAdminUpdateOrganizationFormLogic,
  //  useAdminUpdateOrganizationSignatoryInfoForm
} from 'apps/user/logic';
import { useAdminGetOrganization, useAdminUpdateOrganization } from '../../../data';

export const useAdminUpdateOrganizationPageEffects = () => {
    const { id } = useParams();
    const { organization, isLoading } = useAdminGetOrganization(id);
    const submitHandler = useAdminUpdateOrganization(id);
    const submitSignatoryHandler = useAdminUpdateOrganization(id);
    const formConfig = useAdminUpdateOrganizationFormLogic(organization);
    //const signatoryFormConfig = useAdminUpdateOrganizationSignatoryInfoForm(organization);

    const formProps = {
        ...formConfig,
        submitHandler
    };

    const signatoryFormProps = {
       // ...signatoryFormConfig,
        submitHandler: submitSignatoryHandler
    };

    return { formProps, signatoryFormProps, isLoading };
};
