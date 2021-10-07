import { expect } from 'chai';
import { CommissioningDateRange } from './enums';
import { getDateRangeFromYear } from './get-commissioning-date-range';

describe('getDateRangeFromYear function', () => {
  const dateRange1 = getDateRangeFromYear('2012-03-21');
  const dateRange2 = getDateRangeFromYear('2021-05-01');
  const dateRange3 = getDateRangeFromYear('2009-07-11');
  const dateRange4 = getDateRangeFromYear('2005-11-21');
  expect(dateRange1).to.eq(CommissioningDateRange.Between_years_6_10);
  expect(dateRange2).to.eq(CommissioningDateRange.Year_1);
  expect(dateRange3).to.eq(CommissioningDateRange.Between_years_11_15);
  expect(dateRange4).to.eq(CommissioningDateRange.Above_15_years);
});
