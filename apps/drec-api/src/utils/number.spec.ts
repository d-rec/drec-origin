//import { expect } from 'chai';
import { roundToClosestLower } from './number';

describe('roundToClosestLower function', () => {
  it('number', async () => {
    const oneMinute = 1000 * 60;
    const thirtyMinutes = oneMinute * 30;
    const date = 1626084336714;
    const formmatedNumber = roundToClosestLower(date, thirtyMinutes);
    expect(formmatedNumber).toEqual(1626084000000);
  });
});
