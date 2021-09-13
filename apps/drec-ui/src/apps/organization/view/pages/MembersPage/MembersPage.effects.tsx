import { useOrganizationMembersData } from 'apps/organization/data';
import { useMembersTableLogic } from 'apps/organization/logic';

export const useMembersPageEffects = () => {
    const { members, isLoading } = useOrganizationMembersData();

    const tableData = useMembersTableLogic({
        users: members,
        loading: isLoading
    });

    return { isLoading, tableData };
};
