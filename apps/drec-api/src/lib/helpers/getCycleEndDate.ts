import { DateTime } from 'luxon';
import { CertificateGenerationFrequency } from '../../utils/enums';

export const getFrequencyInHours = (frequency: string): number => {
  const HOURS_PER_DAY = 24;

  switch (frequency?.toLowerCase()) {
    case CertificateGenerationFrequency.daily:
      return HOURS_PER_DAY;
    case CertificateGenerationFrequency.weekly:
      return HOURS_PER_DAY * 7;
    case CertificateGenerationFrequency.monthly:
      return HOURS_PER_DAY * 30;
    case CertificateGenerationFrequency.quarterly:
      return HOURS_PER_DAY * 91;
    default:
      return 1;
  }
};

export const getCycleEndDate = (startDate: Date, frequency: string): Date => {
  const frequencyInHours = getFrequencyInHours(frequency);
  return new Date(startDate.getTime() + frequencyInHours * 3.6e6); // 3.6e6 is the number of milliseconds in an hour
};

export const getMinDateByFrequency = (
  date: DateTime,
  frequency: string,
): DateTime => {
  switch (frequency) {
    case CertificateGenerationFrequency.daily:
      return date.startOf('day');
    case CertificateGenerationFrequency.weekly:
      return date.startOf('week');
    case CertificateGenerationFrequency.monthly:
      return date.startOf('month');
    case CertificateGenerationFrequency.quarterly:
      return date.startOf('quarter');
    default:
      // Default to hourly if frequency is not recognized
      return date.startOf('hour');
  }
};

export const getMaxDateByFrequency = (
  date: DateTime,
  frequency: string,
): DateTime => {
  switch (frequency) {
    case CertificateGenerationFrequency.daily:
      return date.endOf('day');
    case CertificateGenerationFrequency.weekly:
      return date.endOf('week');
    case CertificateGenerationFrequency.monthly:
      return date.endOf('month');
    case CertificateGenerationFrequency.quarterly:
      return date.endOf('quarter');
    default:
      // Default to hourly if frequency is not recognized
      return date.endOf('hour');
  }
};
