import { expect } from 'chai';
import { groupByProps } from './group-by-properties';
import TestDevicesToGroup from '../../test/test-devices-for-grouping.json';

describe('groupByProps function', () => {
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

  expect(groupDevices).to.be.instanceOf(Array);
  expect(groupDevices).to.have.length(2);
});
