import { CommissioningDateRange } from './enums';
import { getDateRangeFromYear } from './get-commissioning-date-range';

describe('getDateRangeFromYear function', () => {
  it('should return correct date range for commissioning date', () => {
    const currentYear = new Date().getFullYear();
    expect(getDateRangeFromYear(`${currentYear}-01-01`)).toEqual(
      CommissioningDateRange.Year_1_Q1,
    );
    expect(getDateRangeFromYear(`${currentYear}-05-01`)).toEqual(
      CommissioningDateRange.Year_1_Q2,
    );
    expect(getDateRangeFromYear(`${currentYear}-08-01`)).toEqual(
      CommissioningDateRange.Year_1_Q3,
    );
    expect(getDateRangeFromYear(`${currentYear}-11-01`)).toEqual(
      CommissioningDateRange.Year_1_Q4,
    );
    expect(getDateRangeFromYear(`${currentYear - 1}-02-01`)).toEqual(
      CommissioningDateRange.Year_2,
    );
    expect(getDateRangeFromYear(`${currentYear - 2}-02-01`)).toEqual(
      CommissioningDateRange.Year_3,
    );
    expect(getDateRangeFromYear(`${currentYear - 3}-02-01`)).toEqual(
      CommissioningDateRange.Year_4,
    );
    expect(getDateRangeFromYear(`${currentYear - 4}-02-01`)).toEqual(
      CommissioningDateRange.Year_5,
    );
    expect(getDateRangeFromYear(`${currentYear - 6}-02-01`)).toEqual(
      CommissioningDateRange.Between_years_6_10,
    );
    expect(getDateRangeFromYear(`${currentYear - 11}-02-01`)).toEqual(
      CommissioningDateRange.Between_years_11_15,
    );
    expect(getDateRangeFromYear(`${currentYear - 19}-02-01`)).toEqual(
      CommissioningDateRange.Above_15_years,
    );
  });
});
