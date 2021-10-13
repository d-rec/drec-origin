import { CardWithImageProps, IconTextProps, SpecFieldProps } from '@energyweb/origin-ui-core';
import { CodeNameDTO, DeviceGroupDTO } from '@energyweb/origin-drec-api-client';

type TUseSpecsForAllDeviceGroupCardArgs = {
    deviceGroup: DeviceGroupDTO;
    allTypes: CodeNameDTO[];
    clickHandler: (link: string) => void;
};

type TUseSpecsForAllDeviceGroupCardReturnType = {
    specsData: SpecFieldProps[];
    iconsData: IconTextProps[];
    cardProps: Omit<CardWithImageProps, 'content'>;
};

export type TUseSpecsForAllDeviceGroupCard = (
    args: TUseSpecsForAllDeviceGroupCardArgs
) => TUseSpecsForAllDeviceGroupCardReturnType;
