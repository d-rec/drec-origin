import { useMyOrganizationData } from '../../../api';
import { getOrganizationViewLogic } from '../../logic';

export const useOrganizationViewPageEffects = () => {
    const { organizationLoading, organization } = useMyOrganizationData();

    const { orgFormData } = !!organization && getOrganizationViewLogic(organization);

    return {
        pageLoading: organizationLoading,
        orgFormData
    };
};
