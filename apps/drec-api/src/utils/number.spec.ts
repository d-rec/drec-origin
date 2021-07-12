import { expect } from 'chai';
import { roundToClosestLower } from './number';

describe('roundToClosestLower function', () => {
  const oneMinute = 1000 * 60;
  const thirtyMinutes = oneMinute * 30;
  const date = 1626084336714;
  const formmatedNumber = roundToClosestLower(date, thirtyMinutes);
  expect(formmatedNumber).to.eq(1626084000000);
});
