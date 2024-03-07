import { CommissioningDateRange } from './enums';
import { getDateRangeFromYear } from './get-commissioning-date-range';

describe('getDateRangeFromYear function', () => {
  it('should return correct date range for commissioning date', () => {
    expect(getDateRangeFromYear('2024-01-01')).toEqual(CommissioningDateRange.Year_1_Q1);
    expect(getDateRangeFromYear('2024-05-01')).toEqual(CommissioningDateRange.Year_1_Q2);
    expect(getDateRangeFromYear('2024-08-01')).toEqual(CommissioningDateRange.Year_1_Q3);
    expect(getDateRangeFromYear('2024-11-01')).toEqual(CommissioningDateRange.Year_1_Q4);
    expect(getDateRangeFromYear('2023-02-01')).toEqual(CommissioningDateRange.Year_2);
    expect(getDateRangeFromYear('2022-02-01')).toEqual(CommissioningDateRange.Year_3);
    expect(getDateRangeFromYear('2021-02-01')).toEqual(CommissioningDateRange.Year_4);
    expect(getDateRangeFromYear('2020-02-01')).toEqual(CommissioningDateRange.Year_5);
    expect(getDateRangeFromYear('2018-02-01')).toEqual(CommissioningDateRange.Between_years_6_10);
    expect(getDateRangeFromYear('2013-02-01')).toEqual(CommissioningDateRange.Between_years_11_15);
    expect(getDateRangeFromYear('2005-02-01')).toEqual(CommissioningDateRange.Above_15_years);
  });
});
