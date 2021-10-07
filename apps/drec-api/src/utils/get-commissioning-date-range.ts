import { CommissioningDateRange } from './enums';

export const getDateRangeFromYear = (
  commissioningDate: string,
): CommissioningDateRange => {
  const year = new Date(commissioningDate).getFullYear();
  const currentYear = new Date().getFullYear();
  const range = currentYear - year;
  if (range === 0) {
    return CommissioningDateRange.Year_1;
  } else if (range === 1) {
    return CommissioningDateRange.Year_2;
  } else if (range === 2) {
    return CommissioningDateRange.Year_3;
  } else if (range === 3) {
    return CommissioningDateRange.Year_4;
  } else if (range === 4) {
    return CommissioningDateRange.Year_5;
  } else if (range >= 6 && range <= 10) {
    return CommissioningDateRange.Between_years_6_10;
  } else if (range >= 11 && range <= 15) {
    return CommissioningDateRange.Between_years_11_15;
  } else {
    return CommissioningDateRange.Above_15_years;
  }
};
