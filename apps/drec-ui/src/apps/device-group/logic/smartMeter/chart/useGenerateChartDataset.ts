import { AggregatedReadDTO } from '@energyweb/origin-drec-api-client';
import { useTheme } from '@material-ui/core';
import { getMegawattsFromWatts } from 'utils';

export const useGenerateChartDataset = (reads: AggregatedReadDTO[]) => {
    const theme = useTheme();
    const currentData = reads.map((read) => getMegawattsFromWatts(read.value));

    return [
        {
            data: currentData,
            backgroundColor: theme.palette.primary.main,
            label: 'Energy (MWh)'
        }
    ];
};
