import { useState } from 'react';
import { useApproveOperatorHandler, useUpdateBlockchainAddress } from 'apps/user/data';
import { useOrganizationBlockchainAddressLogic } from 'apps/user/logic';
import { useUserAppEnv } from '../../../context';

export const useOrganizationBlockchainAddressEffects = () => {
    const [isUpdating, setIsUpdating] = useState(false);
    const { registrationMessage } = useUserAppEnv();

    const api = useUpdateBlockchainAddress(registrationMessage, setIsUpdating);
    const operatorApproval = useApproveOperatorHandler();
    const logic = useOrganizationBlockchainAddressLogic();

    return { ...operatorApproval, ...api, isUpdating, ...logic };
};
