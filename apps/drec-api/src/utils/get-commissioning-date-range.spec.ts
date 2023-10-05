import { expect } from 'chai';
import { CommissioningDateRange } from './enums';
import { getDateRangeFromYear } from './get-commissioning-date-range';

describe('getDateRangeFromYear function', () => {
  const date1 = new Date();
  date1.setMonth(11);
  const dateRange1 = getDateRangeFromYear(date1.toISOString());
  const dateRange2 = getDateRangeFromYear('2005-11-21');
  expect(dateRange1).to.eq(CommissioningDateRange.Year_1_Q4);
  expect(dateRange2).to.eq(CommissioningDateRange.Above_15_years);
});
