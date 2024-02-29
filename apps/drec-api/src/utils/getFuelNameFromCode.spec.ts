//import { expect } from 'chai';
import { FuelCode } from './enums';
import { getFuelNameFromCode } from './getFuelNameFromCode';

describe('getFuelNameFromCode function', () => {
  it('getFuelCode', async()=> {
    //const code = 'ES100';
    const fuelType = getFuelNameFromCode(FuelCode.ES100);
    expect(fuelType).toEqual('Solar');
  });
});
