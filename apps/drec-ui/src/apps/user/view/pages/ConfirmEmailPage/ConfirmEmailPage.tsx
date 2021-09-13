import { useEffect } from 'react';
import { useUser } from 'api';
import { useQueryParams } from 'utils';
import { useConfirmEmailHandler } from 'apps/user/data';

export const ConfirmEmailPage = () => {
    const queryParams = useQueryParams();
    const token = queryParams.get('token');
    const { user, userLoading } = useUser();
    const confirmHandler = useConfirmEmailHandler(user);

    useEffect(() => {
        if (!!token && !userLoading) {
            confirmHandler(token);
        }
    }, [token, userLoading]);

    return <div></div>;
};
