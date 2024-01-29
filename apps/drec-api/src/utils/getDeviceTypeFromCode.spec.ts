import { expect } from 'chai';
import { getDeviceTypeFromCode } from './getDeviceTypeFromCode';

describe('getDeviceTypeFromCode function', () => {
  const code = 'T020001';
  const deviceType = getDeviceTypeFromCode(code);
  expect(deviceType).to.eq('Wind: Onshore');
});
