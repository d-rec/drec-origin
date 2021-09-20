import { useEffect, useState } from 'react';
import { isEmpty } from 'lodash';
import { useWeb3React } from '@web3-react/core';
import { useApproveOperatorHandler, useUpdateBlockchainAddress } from 'apps/user/data';
import { useOrganizationBlockchainAddressLogic } from 'apps/user/logic';
import { useUserAppEnv } from '../../../context';
import { Web3Provider } from '@ethersproject/providers';

export const useOrganizationBlockchainAddressEffects = () => {
    const [isUpdating, setIsUpdating] = useState(false);
    const [isOperatorApproved, setOperatorApproved] = useState<boolean>(null);
    const [givingApproval, setGivingApproval] = useState(false);

    const { library: web3 } = useWeb3React();
    const { registrationMessage, issuerAddress } = useUserAppEnv();

    const {
        blockchainAddress,
        status,
        isLoading: isBlockchainAddressLoading,
        submitHandler
    } = useUpdateBlockchainAddress(registrationMessage, setIsUpdating);
    const {
        checkOperatorApprovedForAll,
        approveOperatorHandler,
        isLoading: isOperatorHandlerLoading,
        blockchainProperties
    } = useApproveOperatorHandler(issuerAddress, setGivingApproval);
    const logic = useOrganizationBlockchainAddressLogic();

    const getOperatorApproved = async (web3: Web3Provider) => {
        const isApproved = await checkOperatorApprovedForAll(web3, blockchainProperties);
        setOperatorApproved(isApproved);
    };

    const isLoading = isBlockchainAddressLoading || isOperatorHandlerLoading;

    useEffect(() => {
        if (!isLoading && !isEmpty(blockchainProperties)) {
            getOperatorApproved(web3);
        }
    }, [isLoading, blockchainProperties, web3]);

    return {
        approveOperatorHandler,
        isLoading,
        isOperatorApproved,
        blockchainAddress,
        status,
        submitHandler,
        isUpdating,
        givingApproval,
        ...logic
    };
};
