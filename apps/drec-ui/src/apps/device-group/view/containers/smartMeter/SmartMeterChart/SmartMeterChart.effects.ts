import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { ReadingsWindowEnum } from 'utils';
import { useSmartMeterReads } from 'apps/device-group/data';
import {
    setDateBasedOnWindow,
    useChartDataLogic,
    useDateArrowHandlers,
    useSmartMeterChartSelectors
} from 'apps/device/logic';

export const useSmartMeterChartsEffects = (meterId: number) => {
    const [window, setWindow] = useState(ReadingsWindowEnum.Day);
    const [startDate, setStartDate] = useState(dayjs().startOf('day').toDate());
    const [endDate, setEndDate] = useState(dayjs().endOf('day').toDate());

    useEffect(() => {
        setDateBasedOnWindow({ window, setStartDate, setEndDate });
    }, [window]);

    const { incrementDate, decrementDate } = useDateArrowHandlers({
        window,
        startDate,
        endDate,
        setStartDate,
        setEndDate
    });

    const { reads } = useSmartMeterReads({
        meterId,
        start: startDate,
        end: endDate,
        window
    });

    const chartData = useChartDataLogic({ reads, startDate, endDate, window });

    const { windowButtons, displayDate } = useSmartMeterChartSelectors({
        startDate,
        endDate,
        selectedWindow: window
    });

    return {
        reads,
        windowButtons,
        displayDate,
        window,
        setWindow,
        incrementDate,
        decrementDate,
        chartData
    };
};
