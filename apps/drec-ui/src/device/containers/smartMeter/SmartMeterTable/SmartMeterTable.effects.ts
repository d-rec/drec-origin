import { useSmartMeterTableLogic } from '../../../logic';
import { DeviceDTO, ReadDTO } from '@energyweb/origin-drec-api-client';

export const useSmartMeterTableEffects = (device: DeviceDTO) => {
    // @should connect to actual readings api
    const reads: ReadDTO[] = [];

    const tableProps = useSmartMeterTableLogic({
        device,
        reads,
        loading: false
    });

    return tableProps;
};
