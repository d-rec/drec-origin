import { expect } from 'chai';
import { getFuelNameFromCode } from './getFuelNameFromCode';

describe('getFuelNameFromCode function', () => {
  const code = 'ES100';
  const fuelType = getFuelNameFromCode(code);
  expect(fuelType).to.eq('Solar');
});
