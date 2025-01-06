import { CommissioningDateRange } from './enums';

export const getDateRangeFromYear = (
  commissioningDate: string,
): CommissioningDateRange => {
  const commissioningYear = new Date(commissioningDate).getFullYear();
  const currentYear = new Date().getFullYear();
  const month = new Date(commissioningDate).getMonth();

  const range = currentYear - commissioningYear;

  if (range === 0) {
    if (month < 3) {
      return CommissioningDateRange.Year_1_Q1;
    } else if (month >= 3 && month < 6) {
      return CommissioningDateRange.Year_1_Q2;
    } else if (month >= 6 && month < 9) {
      return CommissioningDateRange.Year_1_Q3;
    } else {
      return CommissioningDateRange.Year_1_Q4;
    }
  } else if (range === 1 && new Date().getMonth() < month) {
    if (month < 3) {
      return CommissioningDateRange.Year_1_Q1;
    } else if (month >= 3 && month < 6) {
      return CommissioningDateRange.Year_1_Q2;
    } else if (month >= 6 && month < 9) {
      return CommissioningDateRange.Year_1_Q3;
    } else {
      return CommissioningDateRange.Year_1_Q4;
    }
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
