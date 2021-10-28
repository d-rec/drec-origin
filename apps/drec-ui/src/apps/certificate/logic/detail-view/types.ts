import { CodeNameDTO, DeviceGroupDTO } from '@energyweb/origin-drec-api-client';
import { IconTextProps } from '@energyweb/origin-ui-core';

type TUseDeviceGroupDetailsLogicArgs = {
    deviceGroup: DeviceGroupDTO;
    owner: string;
    allTypes: CodeNameDTO[];
};

type TUseDeviceGroupDetailsLogicReturnType = {
    locationProps: {
        owner: string;
        location: string;
    };
    cardProps: {
        headingIconProps: IconTextProps;
    };
};

export type TUseDeviceGroupDetailsLogic = (
    args: TUseDeviceGroupDetailsLogicArgs
) => TUseDeviceGroupDetailsLogicReturnType;
