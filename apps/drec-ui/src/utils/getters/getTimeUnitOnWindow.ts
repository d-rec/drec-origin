import { OpUnitType } from 'dayjs';
import { ReadingsWindowEnum } from '../enumExports';

export const getTimeUnitOnWindow = (window: ReadingsWindowEnum): OpUnitType | 'isoWeek' => {
    switch (window) {
        case ReadingsWindowEnum.Day:
            return 'day';
        case ReadingsWindowEnum.Week:
            return 'isoWeek';
        case ReadingsWindowEnum.Month:
            return 'month';
        case ReadingsWindowEnum.Year:
            return 'year';
    }
};
