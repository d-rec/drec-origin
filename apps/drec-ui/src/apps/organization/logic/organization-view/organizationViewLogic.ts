import { OrganizationDTO } from '@energyweb/origin-drec-api-client';
import { DisabledFormViewProps } from '@energyweb/origin-ui-core';
import { formatOrganizationBusinessType } from 'utils';

type TViewLogicReturnType = {
    orgFormData: DisabledFormViewProps;
};

type TOrganizationViewLogic = (organization: OrganizationDTO) => TViewLogicReturnType;

export const getOrganizationViewLogic: TOrganizationViewLogic = (organization) => ({
    orgFormData: {
        heading: 'Organization Information',
        data: [
            {
                label: 'Organization Name',
                value: organization.name
            },
            {
                label: 'Organization Address',
                value: organization.address
            },
            {
                label: 'Business Type',
                value: formatOrganizationBusinessType(organization.businessType)
            },
            {
                label: 'Trade Registry Company number',
                value: organization.tradeRegistryCompanyNumber
            },
            {
                label: 'VAT number',
                value: organization.tradeRegistryCompanyNumber
            },
            {
                label: 'Signatory Full Name',
                value: organization.signatoryFullName
            },
            {
                label: 'Signatory Address',
                value: organization.signatoryAddress
            },
            {
                label: 'Signatory Email',
                value: organization.signatoryEmail
            },
            {
                label: 'Signatory Phone',
                value: organization.signatoryPhoneNumber
            },
            {
                label: 'Status',
                value: organization.status
            }
        ]
    }
});
