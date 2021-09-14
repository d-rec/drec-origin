import { OrganizationDTO } from '@energyweb/origin-drec-api-client';

export const prepareBeneficiariesOptions = (beneficiaries: OrganizationDTO[]) => {
    return beneficiaries?.map((beneficiary) => ({
        label: `
    ID: ${beneficiary.id},
    Name: ${beneficiary.name}
    `,
        value: beneficiary.id
    }));
};
