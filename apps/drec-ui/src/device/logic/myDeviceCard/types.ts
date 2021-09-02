import { FallbackIconProps, IconTextProps, SpecFieldProps } from '@energyweb/origin-ui-core';
import { DeviceDTO, CodeNameDTO } from '@energyweb/origin-drec-api-client';

type TUseSpecsForMyDeviceCardArgs = {
    device: DeviceDTO;
    allTypes: CodeNameDTO[];
    imageUrl: string;
};

export type TUseSpecsForMyDeviceCardReturnType = {
    imageUrl: string;
    fallbackIcon: FallbackIconProps['icon'];
    cardHeaderProps: {
        deviceName: string;
        buttonText: string;
        buttonLink: string;
        specFieldProps: SpecFieldProps;
    };
    cardContentProps: {
        iconsProps: IconTextProps[];
    };
};

export type TUseSpecsForMyDeviceCard = (
    args: TUseSpecsForMyDeviceCardArgs
) => TUseSpecsForMyDeviceCardReturnType;
