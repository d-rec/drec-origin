import { useMyOrganizationData } from 'apps/organization/data';
import { getOrganizationViewLogic } from 'apps/organization/logic';

export const useOrganizationViewPageEffects = () => {
    const { organizationLoading, organization } = useMyOrganizationData();

    const { orgFormData } = !!organization && getOrganizationViewLogic(organization);

    return {
        pageLoading: organizationLoading,
        orgFormData
    };
};
