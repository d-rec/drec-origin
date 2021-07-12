import { expect } from 'chai';
import { roundToClosestLower } from './number';

describe('roundToClosestLower function', () => {
  const oneMinute = 1000 * 60;
  const thirtyMinutes = oneMinute * 30;
  const date = Date.now();
  const formmatedNumber = roundToClosestLower(date, thirtyMinutes);
  expect(formmatedNumber).to.eq(1626082200000);
});
