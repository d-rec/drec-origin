
import { useAllYieldValue } from '../../../data';
import { YieldConfigDTO } from '@energyweb/origin-drec-api-client';
import { getYieldValueViewLogic } from 'apps/yieldconfiguration/logic';
import { PermIdentityOutlined } from '@mui/icons-material';
import { useNavigate } from 'react-router';
export const useYieldConfigEffects = () => {
    // const { yieldvaluedata,yieldLoading } = useAllYieldValue();

    // const { yieldFormData } = !!yieldvaluedata && getYieldValueViewLogic(yieldvaluedata);

    // return {
    //     pageLoading: yieldLoading,
    //     yieldFormData
    // };

    const { yieldvaluedata,yieldLoading } = useAllYieldValue();
    const navigate = useNavigate();

    const actions = [
        {
            icon: <PermIdentityOutlined data-cy="edit-user-icon" />,
            name: 'Update',
            onClick: (id: YieldConfigDTO['id']) => navigate(`/admin/update-user/${id}`)
        }
    ];
    const tableProps = getYieldValueViewLogic(yieldvaluedata, actions,yieldLoading );

    return tableProps;
}
