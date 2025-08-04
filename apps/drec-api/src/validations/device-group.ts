import { ConflictException } from '@nestjs/common';
import { Device } from '../pods/device/device.entity';

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
