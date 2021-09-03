import { EnergyFormatter } from '@energyweb/origin-ui-utils';
import dayjs from 'dayjs';
import { BigNumber } from 'ethers';
import { TUseSmartMeterTableArgs, TUseSmartMeterTableLogic } from '../types';

const formatReadsData = (reads: TUseSmartMeterTableArgs['reads']) => {
    return reads?.map((reading) => ({
        id: reading.timestamp,
        time: dayjs(Number(reading.timestamp)).format('DD-MM-YYYY HH:mm'),
        meterValue: EnergyFormatter.format(BigNumber.from(reading.value))
    }));
};

export const useSmartMeterTableLogic: TUseSmartMeterTableLogic = ({ device, reads, loading }) => {
    return {
        header: {
            meterValue: `Meter value ${EnergyFormatter.displayUnit}`
        },
        loading,
        pageSize: 5,
        data: formatReadsData(reads)
    };
};
