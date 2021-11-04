import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import isoWeek from 'dayjs/plugin/isoWeek';
import timezone from 'dayjs/plugin/timezone';
import { TimeUnitPluralEnum } from 'utils';
import { TUseGenerateChartLabelsArgs } from '../types';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isoWeek);

export const useGenerateChartLabels = ({
    start,
    end,
    multiplier,
    format
}: TUseGenerateChartLabelsArgs) => {
    const labels: string[] = [];

    for (
        let current = start;
        current < end;
        current = dayjs(current).add(multiplier, TimeUnitPluralEnum.minutes).toDate()
    ) {
        if (labels.includes(dayjs(current).format(format))) {
            continue;
        }
        const formatted = dayjs(current).format(format);
        labels.push(formatted);
    }

    return labels;
};
