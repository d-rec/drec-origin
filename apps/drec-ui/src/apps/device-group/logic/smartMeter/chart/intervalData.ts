import { TIntervalData } from '../types';

export const intervalData: TIntervalData = {
    '1h': { label: 'Day', multiplier: 60, format: 'HH:mm' },
    '1d': { label: 'Week', multiplier: 60 * 24, format: 'DD MMM' },
    '1w': { label: 'Month', multiplier: 60 * 24 * 7, format: 'DD MMM' },
    '1mo': { label: 'Year', multiplier: 60 * 24 * 30, format: 'MMMM' }
};
