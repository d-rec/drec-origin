//import { expect } from 'chai';
import { getDeviceTypeFromCode } from './getDeviceTypeFromCode';

describe('getDeviceTypeFromCode function', () => {
  it('deviceType', async()=> {
    const code1 = 'TC110';
    const code2 = 'TC120';
    const code3 = 'TC130';
    const code4 = 'TC140';
    const code5 = 'TC150';

    const deviceType1 = getDeviceTypeFromCode(code1);
    const deviceType2 = getDeviceTypeFromCode(code2);
    const deviceType3 = getDeviceTypeFromCode(code3);
    const deviceType4 = getDeviceTypeFromCode(code4);
    const deviceType5 = getDeviceTypeFromCode(code5);

    expect(deviceType1).toEqual('PV Ground mounted');
    expect(deviceType2).toEqual('PV Roof Mounted (single installation)');
    expect(deviceType3).toEqual('PV Floating');
    expect(deviceType4).toEqual('PV Aggregated');
    expect(deviceType5).toEqual('Solar Thermal Concentration');
  });
});
