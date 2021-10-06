import { expect } from 'chai';
import { groupByProps, groupByProperties } from './group-by-properties';
import TestDevicesToGroup from '../../migrations/test-devices-for-grouping.json';

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
  const groupDevicesByProps = groupByProperties(TestDevicesToGroup, (item) => {
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
  expect(groupDevicesByProps).to.be.instanceOf(Array);
  expect(groupDevices).to.have.length(2);
  expect(groupDevicesByProps).to.have.length(2);
});
