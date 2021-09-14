import { useState } from 'react';
import { useUpdateBlockchainAddress } from 'apps/user/data';
import { useOrganizationBlockchainAddressLogic } from 'apps/user/logic';
import { useUserAppEnv } from '../../../context';

export const useOrganizationBlockchainAddressEffects = () => {
    const [isUpdating, setIsUpdating] = useState(false);
    const { registrationMessage } = useUserAppEnv();

    const api = useUpdateBlockchainAddress(registrationMessage, setIsUpdating);
    const logic = useOrganizationBlockchainAddressLogic();

    return { ...api, isUpdating, ...logic };
};
