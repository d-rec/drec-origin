import { useOrganizationMembersData } from '../../../api';
import { useMembersTableLogic } from '../../logic';

export const useMembersPageEffects = () => {
    const { members, isLoading } = useOrganizationMembersData();

    const tableData = useMembersTableLogic({
        users: members,
        loading: isLoading
    });

    return { isLoading, tableData };
};
