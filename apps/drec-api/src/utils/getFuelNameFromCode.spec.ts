import { FuelCode } from './enums';
import { getFuelNameFromCode } from './getFuelNameFromCode';

describe('getFuelNameFromCode function', () => {
  it('getFuelCode', async () => {
    const fuelType = getFuelNameFromCode(FuelCode.ES100);
    expect(fuelType).toEqual('Solar');
  });
});
