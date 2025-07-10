import { EvidentIssuanceRequestFrequency } from '../../types/evident';
import { DateTime } from 'luxon';

export const getEvidentNextIssuanceDate = (
  lastIssuanceDate: Date | null | undefined,
  frequency: EvidentIssuanceRequestFrequency,
): Date => {
  if (!lastIssuanceDate) {
    return new Date();
  }

  const lastIssuance = DateTime.fromJSDate(lastIssuanceDate);

  switch (frequency) {
    case EvidentIssuanceRequestFrequency.Quarterly:
      return lastIssuance.plus({ months: 3 }).toJSDate();
    case EvidentIssuanceRequestFrequency.SemiAnnually:
      return lastIssuance.plus({ months: 6 }).toJSDate();
    default:
      return lastIssuance.plus({ months: 1 }).toJSDate();
  }
};
