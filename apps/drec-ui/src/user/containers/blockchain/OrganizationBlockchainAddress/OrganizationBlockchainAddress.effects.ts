import { useState } from 'react';
import { useUserAppEnv } from '../../../context';
import { useUpdateBlockchainAddress } from '../../../handlers';
import { useOrganizationBlockchainAddressLogic } from '../../../logic';

export const useOrganizationBlockchainAddressEffects = () => {
    const [isUpdating, setIsUpdating] = useState(false);
    const { registrationMessage } = useUserAppEnv();

    const api = useUpdateBlockchainAddress(registrationMessage, setIsUpdating);
    const logic = useOrganizationBlockchainAddressLogic();

    return { ...api, isUpdating, ...logic };
};
