import { FallbackIconProps, IconTextProps, SpecFieldProps } from '@energyweb/origin-ui-core';
import { DeviceGroupDTO, CodeNameDTO } from '@energyweb/origin-drec-api-client';

type TUseSpecsForMyDeviceGroupCardArgs = {
    deviceGroup: DeviceGroupDTO;
    allTypes: CodeNameDTO[];
};

export type TUseSpecsForMyDeviceGroupCardReturnType = {
    fallbackIcon: FallbackIconProps['icon'];
    cardHeaderProps: {
        deviceGroupId: number;
        deviceGroupName: string;
        buttonText: string;
        buttonLink: string;
        groupAttributes: SpecFieldProps[][];
        specFieldProps: SpecFieldProps[];
    };
    cardContentProps: {
        iconsProps: IconTextProps[];
    };
};

export type TUseSpecsForMyDeviceGroupCard = (
    args: TUseSpecsForMyDeviceGroupCardArgs
) => TUseSpecsForMyDeviceGroupCardReturnType;
