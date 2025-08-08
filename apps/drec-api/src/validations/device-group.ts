import { ConflictException } from '@nestjs/common';
import { Device } from '../pods/device/device.entity';
import { SMALL_DEVICES_MAX_CAPACITY } from '../constants';

export function validateDevicesAreHomogeneous(devices: Device[]): void {
  const firstDevice = devices[0];
  for (const device of devices) {
    if (device.countryCode !== firstDevice.countryCode) {
      throw new ConflictException({
        success: false,
        message: `All devices must be from the same country`,
      });
    }
    if (device.dataSource !== firstDevice.dataSource) {
      throw new ConflictException({
        success: false,
        message: `All devices must use the same energy source`,
      });
    }
    if (device.fuelCode !== firstDevice.fuelCode) {
      throw new ConflictException({
        success: false,
        message: `All devices must use the same technology`,
      });
    }
  }
}
export function isDeviceGroupable(
  devices: Device[],
  organizationId: number,
): void {
  for (const device of devices) {
    if (device.organizationId !== organizationId) {
      throw new ConflictException({
        success: false,
        message: `Device to be grouped must belong to the same organization`,
      });
    }
    if (device.capacity >= SMALL_DEVICES_MAX_CAPACITY) {
      throw new ConflictException({
        success: false,
        message: `Only devices less than ${SMALL_DEVICES_MAX_CAPACITY}KW can be added to a group`,
      });
    }
  }
}
