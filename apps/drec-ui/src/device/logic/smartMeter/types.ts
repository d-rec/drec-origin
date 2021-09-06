import { AggregatedReadDTO, ReadDTO, DeviceDTO } from '@energyweb/origin-drec-api-client';
import { ReadingsWindowEnum } from '../../../api';

export type TUseSmartMeterTableArgs = {
    device: DeviceDTO;
    reads: ReadDTO[];
    loading: boolean;
};

export type TUseSmartMeterChartSelectorsArgs = {
    startDate: Date;
    endDate: Date;
    selectedWindow: ReadingsWindowEnum;
};

export type TSetDateBasedOnWindowArgs = {
    window: ReadingsWindowEnum;
    setStartDate: (value: Date) => void;
    setEndDate: (value: Date) => void;
};

export type TInterval = {
    label: string;
    multiplier: number;
    format: string;
};

export type TIntervalData = {
    [key: string]: TInterval;
};

export type TUseChartDataLogicArgs = {
    reads: AggregatedReadDTO[];
    startDate: Date;
    endDate: Date;
    window: ReadingsWindowEnum;
};

export type TUseGenerateChartLabelsArgs = {
    start: Date;
    end: Date;
    multiplier: number;
    format: string;
};
