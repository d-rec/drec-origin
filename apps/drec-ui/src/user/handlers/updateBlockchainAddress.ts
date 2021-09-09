import {
    getUserControllerMeQueryKey,
    OrganizationStatus,
    useOrganizationControllerSetBlockchainAddress,
    UserStatus
} from '@energyweb/origin-drec-api-client';
import { useQueryClient } from 'react-query';
import { useWeb3React } from '@web3-react/core';
import { signTypedMessage } from '@energyweb/utils-general';
import { NotificationTypeEnum, showNotification } from '@energyweb/origin-ui-core';
import { useUser } from '../../api';
import { userApiErrorHandler } from './errorHandler';

export const useUpdateBlockchainAddress = (
    registrationMessage: string,
    setIsUpdating: (value: boolean) => void
) => {
    const queryClient = useQueryClient();
    const userQuerykey = getUserControllerMeQueryKey();
    const { mutate, error, isError, isSuccess, status } =
        useOrganizationControllerSetBlockchainAddress();

    const { user, userLoading } = useUser();
    const blockchainAddress = user?.organization?.blockchainAccountAddress;
    const { library: web3, account } = useWeb3React();
    const submitHandler = () => {
        try {
            if (user?.status !== UserStatus.Active) {
                throw Error(
                    `Only active users can perform this action. Your status is ${user.status}`
                );
            } else if (
                !user?.organization ||
                user?.organization?.status !== OrganizationStatus.Active
            ) {
                throw Error('Only members of active organization can perform this action');
            } else if (user?.organization?.blockchainAccountAddress === account.toLowerCase()) {
                throw Error('This blockchain address is already connected to your account');
            }

            setIsUpdating(true);

            signTypedMessage(account, registrationMessage, web3).then((signedMessage) => {
                mutate(
                    { data: { signedMessage } },
                    {
                        onSuccess: () => {
                            queryClient.invalidateQueries(userQuerykey);
                            showNotification(
                                'Blockchain address successfully linked to your organization account',
                                NotificationTypeEnum.Success
                            );
                        },
                        onError: (error: any) => {
                            showNotification(
                                error?.response?.data?.message,
                                NotificationTypeEnum.Error
                            );
                        }
                    }
                );
            });

            setIsUpdating(false);
        } catch (error) {
            userApiErrorHandler(error);
        }
    };

    return {
        blockchainAddress,
        status,
        isLoading: userLoading,
        isSuccess,
        isError,
        error,
        submitHandler
    };
};
