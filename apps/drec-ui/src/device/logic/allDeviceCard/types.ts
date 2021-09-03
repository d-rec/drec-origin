import { CardWithImageProps, IconTextProps, SpecFieldProps } from '@energyweb/origin-ui-core';
import { DeviceDTO, CodeNameDTO } from '@energyweb/origin-drec-api-client';

type TUseSpecsForAllDeviceCardArgs = {
    device: DeviceDTO;
    allTypes: CodeNameDTO[];
    clickHandler: (link: string) => void;
    imageUrl: string;
};

type TUseSpecsForAllDeviceCardReturnType = {
    specsData: SpecFieldProps[];
    iconsData: IconTextProps[];
    cardProps: Omit<CardWithImageProps, 'content'>;
};

export type TUseSpecsForAllDeviceCard = (
    args: TUseSpecsForAllDeviceCardArgs
) => TUseSpecsForAllDeviceCardReturnType;
