import {
    useReadsControllerGetGroupAggregatedReads,
    Aggregate
} from '@energyweb/origin-drec-api-client';
import dayjs from 'dayjs';
import { ReadingsWindowEnum } from 'utils';

type TUseSmartMeterReadsArgs = {
    meterId: number;
    start: Date;
    end: Date;
    window: ReadingsWindowEnum;
};

export const useSmartMeterReads = ({ meterId, start, end, window }: TUseSmartMeterReadsArgs) => {
    const { data, isLoading } = useReadsControllerGetGroupAggregatedReads(meterId, {
        start: dayjs(start).toISOString(),
        end: dayjs(end).toISOString(),
        window,
        aggregate: Aggregate.sum,
        difference: false
    });

    const reads = data || [];

    return { reads, isLoading };
};
