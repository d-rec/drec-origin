const OrganizationType = ['Developer', 'Buyer', 'Intermediary','Other'];

export const ORGTYPE_OPTIONS = OrganizationType.map((type) => ({
    label: type,
    value: type
}));
