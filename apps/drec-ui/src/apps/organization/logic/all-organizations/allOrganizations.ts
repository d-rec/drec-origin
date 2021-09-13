import { OrganizationStatus } from '@energyweb/origin-drec-api-client';
import { Countries } from '@energyweb/utils-general';
import { TFormatAllOrgs, TUseAllOrganizationsTableLogic } from './types';

const formatOrganizations: TFormatAllOrgs = ({ allOrganizations, actions }) => {
    return allOrganizations?.map((org) => ({
        id: org.id,
        name: org.name,
        country: Countries.find((country) => country.code === org.country)?.name,
        tradeRegistryNumber: org.tradeRegistryCompanyNumber,
        status: org.status,
        actions: org.status === OrganizationStatus.Submitted ? actions : undefined
    }));
};

export const useAllOrganizationsTableLogic: TUseAllOrganizationsTableLogic = ({
    allOrganizations,
    actions,
    isLoading
}) => {
    return {
        header: {
            name: 'Name',
            country: 'Country',
            tradeRegistryNumber: 'Trade Registry Company Number',
            status: 'Status',
            actions: ''
        },
        pageSize: 20,
        loading: isLoading,
        data: formatOrganizations({ allOrganizations, actions }) ?? []
    };
};
