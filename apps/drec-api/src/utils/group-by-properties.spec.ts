import { groupByProps } from './group-by-properties';
import TestDevicesToGroup from '../../test/test-devices-for-grouping.json';

describe('groupByProps function', () => {
  it('groupByProperties', async () => {
    const groupDevices = groupByProps(TestDevicesToGroup, (item) => {
      return [
        item['organizationId'],
        item['countryCode'],
        item['fuelCode'],
        item['standardCompliance'],
        item['installationConfiguration'],
        item['offTaker'],
      ];
    });

    expect(groupDevices).toBeInstanceOf(Array);
    expect(groupDevices).toHaveLength(5);
  });
});
