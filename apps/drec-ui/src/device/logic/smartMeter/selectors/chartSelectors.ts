import { DateFormatEnum } from '@energyweb/origin-ui-utils';
import dayjs from 'dayjs';
import { ReadingsWindowEnum } from '../../../../api';
import { TUseSmartMeterChartSelectorsArgs } from '../types';

export const useSmartMeterChartSelectors = ({
    startDate,
    endDate,
    selectedWindow
}: TUseSmartMeterChartSelectorsArgs) => {
    const windowButtons = [
        {
            label: 'Day',
            value: ReadingsWindowEnum.Day
        },
        {
            label: 'Week',
            value: ReadingsWindowEnum.Week
        },
        {
            label: 'Month',
            value: ReadingsWindowEnum.Month
        },
        {
            label: 'Year',
            value: ReadingsWindowEnum.Year
        }
    ];

    const dateFormat =
        selectedWindow === ReadingsWindowEnum.Day || selectedWindow === ReadingsWindowEnum.Week
            ? DateFormatEnum.DATE_FORMAT_MDY
            : selectedWindow === ReadingsWindowEnum.Month
            ? DateFormatEnum.DATE_FORMAT_MONTH_AND_YEAR
            : DateFormatEnum.DATE_FORMAT_FULL_YEAR;

    const getDisplayDate = () => {
        if (selectedWindow === ReadingsWindowEnum.Week) {
            const formattedStartDate = dayjs(startDate).format(dateFormat);
            const formattedEndDate = dayjs(endDate).format(dateFormat);

            return `${formattedStartDate} - ${formattedEndDate}`;
        }

        return dayjs(startDate).format(dateFormat);
    };

    return {
        windowButtons,
        displayDate: getDisplayDate()
    };
};
