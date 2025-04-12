
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
                return HOURS_PER_DAY * 90;
        default:
          return 1;
      }
    };


export const getCycleEndDate = (startDate: Date, frequency: string): Date => {
    const frequencyInHours = getFrequencyInHours(frequency);
    return new Date(startDate.getTime() + (frequencyInHours * 3.6e6)); // 3.6e6 is the number of milliseconds in an hour
}