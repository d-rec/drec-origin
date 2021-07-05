import { BigNumber } from 'ethers';

export const bigNumSum = (values: BigNumber[]) =>
  values.reduce((sum, value) => sum.add(value), BigNumber.from(0));

export const bigNumAvg = (values: BigNumber[]) =>
  values.length > 0
    ? bigNumSum(values).div(BigNumber.from(values.length))
    : BigNumber.from(0);

export const bigNumMin = (...values: BigNumber[]) =>
  values.reduce((min, value) => {
    return value.lt(min) ? value : min;
  }, values[0]);

export const bigNumPercentage = (part: BigNumber, total: BigNumber) => {
  if (total.eq(0)) {
    return 0;
  }
  return part.mul(1000).div(total).toNumber() / 10;
};
