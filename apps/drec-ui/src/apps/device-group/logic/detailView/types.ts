import { IconTextProps, SpecFieldProps } from '@energyweb/origin-ui-core';
import { DeviceGroupDTO, CodeNameDTO } from '@energyweb/origin-drec-api-client';

type TUseDeviceGroupDetailViewLogicArgs = {
    deviceGroup: DeviceGroupDTO;
    owner: number;
    allTypes: CodeNameDTO[];
};

type TUseDeviceGroupDetailViewLogicReturnType = {
    locationProps: {
        owner: string;
        location: string;
    };
    cardProps: {
        headingIconProps: IconTextProps;
        specFields: SpecFieldProps[];
    };
};

export type TUseDeviceGroupDetailViewLogic = (
    args: TUseDeviceGroupDetailViewLogicArgs
) => TUseDeviceGroupDetailViewLogicReturnType;
