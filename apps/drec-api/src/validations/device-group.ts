import { ConflictException } from '@nestjs/common';
import { Device } from '../pods/device/device.entity';
import { ILoggedInUser } from '../models';
import { Role } from '../utils/enums';
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
  user: ILoggedInUser,
  orgId: number,
  organizationId: number,
): void {
  for (const device of devices) {
    if (user.role === Role.ApiUser) {
      if (Number(orgId) !== device.organizationId) {
        throw new ConflictException({
          success: false,
          message: `Device with id ${device.id} does not belong to this organization ${orgId}`,
        });
      }
    } else {
      if (organizationId !== device.organizationId) {
        throw new ConflictException({
          success: false,
          message: `Device with id ${device.id} does not belong to the organization`,
        });
      }
    }
    if (device.capacity > SMALL_DEVICES_MAX_CAPACITY) {
      throw new ConflictException({
        success: false,
        message: `Only devices less than ${SMALL_DEVICES_MAX_CAPACITY}KW can be added to a group`,
      });
    }
  }
}
