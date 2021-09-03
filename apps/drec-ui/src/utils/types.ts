import { IconTextProps, SpecFieldProps } from '@energyweb/origin-ui-core';
import { DeviceDTO, CodeNameDTO } from '@energyweb/origin-drec-api-client';

type TUseDeviceDetailViewLogicArgs = {
    device: DeviceDTO;
    owner: number;
    allTypes: CodeNameDTO[];
};

type TUseDeviceDetailViewLogicReturnType = {
    locationProps: {
        owner: string;
        location: string;
        coordinates: string;
    };
    cardProps: {
        headingIconProps: IconTextProps;
        specFields: SpecFieldProps[];
    };
};

export type TUseDeviceDetailViewLogic = (
    args: TUseDeviceDetailViewLogicArgs
) => TUseDeviceDetailViewLogicReturnType;
