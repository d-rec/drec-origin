import { useEffect, useState } from 'react';
import { useApproveOperatorHandler, useUpdateBlockchainAddress } from 'apps/user/data';
import { useOrganizationBlockchainAddressLogic } from 'apps/user/logic';
import { useUserAppEnv } from '../../../context';

export const useOrganizationBlockchainAddressEffects = () => {
    const [isUpdating, setIsUpdating] = useState(false);
    const [isOperatorApproved, setOperatorApproved] = useState<boolean>();

    const { registrationMessage } = useUserAppEnv();

    const api = useUpdateBlockchainAddress(registrationMessage, setIsUpdating);
    const operatorApproval = useApproveOperatorHandler();
    const logic = useOrganizationBlockchainAddressLogic();

    const getOperatorApproved = async () => {
        const isApproved = await operatorApproval.checkOperatorApprovedForAll();
        setOperatorApproved(isApproved);
    };
    useEffect(() => {
        getOperatorApproved();
    });

    return { ...operatorApproval, isOperatorApproved, ...api, isUpdating, ...logic };
};
