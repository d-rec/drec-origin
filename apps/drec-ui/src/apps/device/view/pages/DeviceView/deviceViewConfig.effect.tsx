
import { useAllDevice } from '../../../data';
import {DeviceDTO } from '@energyweb/origin-drec-api-client';
import { getdeviceViewLogic } from 'apps/device/logic';
import { PermIdentityOutlined } from '@mui/icons-material';
import { useNavigate } from 'react-router';
export const useDeviceConfigEffects = () => {
    // const { yieldvaluedata,yieldLoading } = useAllYieldValue();

    // const { yieldFormData } = !!yieldvaluedata && getYieldValueViewLogic(yieldvaluedata);

    // return {
    //     pageLoading: yieldLoading,
    //     yieldFormData
    // };

    const {devicedata, deviceLoading } = useAllDevice();
    const navigate = useNavigate();

    const actions = [
        {
            icon: <PermIdentityOutlined data-cy="edit-user-icon" />,
            name: 'Update',
            onClick: (id: DeviceDTO['id']) => navigate(`/admin/update-user/${id}`)
        }
    ];
    const tableProps = getdeviceViewLogic(devicedata, actions,deviceLoading );

    return tableProps;
}
