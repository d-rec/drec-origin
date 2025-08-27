import {
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { Device } from '../pods/device/device.entity';
import { SMALL_DEVICES_MAX_CAPACITY } from '../constants';
import { ILoggedInUser } from '../../src/models';
import { canManageOrganization } from '../../src/lib/organization';
import { CertificateGenerationFrequency, Role } from '../../src/utils/enums';
import { AddGroupDTO } from '../../src/pods/device-group/dto';
import { isValidUTCDateFormat } from '../../src/utils/checkForISOStringFormat';
import { OrganizationService } from '../../src/pods/organization/organization.service';
import { UserService } from '../../src/pods/user/user.service';

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
    if (device.organizationId !== Number(organizationId)) {
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

export async function checkOrganizationAndUser(
  orgId: number | null,
  user: ILoggedInUser,
  organizationId: number,
  organizationService: OrganizationService,
  userService: UserService,
): Promise<number> {
  if (orgId) {
    const organization = await organizationService.findOne(orgId);
    const organizationAdmin = await userService.findUserByOrganization(
      orgId,
      1,
      1,
    );
    const canManage = canManageOrganization({
      user,
      organization,
      organizationAdmin: organizationAdmin[0][0],
    });
    if (!canManage) {
      throw new UnauthorizedException({
        success: false,
        message: 'User cannot manage this organization',
      });
    }
    if (user.role === Role.ApiUser) {
      if (organization.api_user_id !== user.api_user_id) {
        throw new BadRequestException({
          success: false,
          message: 'Organization requested belongs to other apiuser',
        });
      }
      return orgId;
    }
  }
  return organizationId;
}

export function validateDeviceGroupToRegister(
  deviceGroupToRegister: AddGroupDTO,
  organizationId: number,
) {
  if (
    !Array.isArray(deviceGroupToRegister.deviceIds) ||
    deviceGroupToRegister.deviceIds.filter(
      (ele) => ele >= -2147483648 && ele <= 2147483647,
    ).length !== deviceGroupToRegister.deviceIds.length
  ) {
    throw new ConflictException({
      success: false,
      message: 'deviceIds should be an array of integers',
    });
  }
  if (deviceGroupToRegister.deviceIds.length === 0) {
    throw new ConflictException({
      success: false,
      message:
        'Please provide devices for reservation, deviceIds is empty at least one device is required',
    });
  }

  if (
    isNaN(deviceGroupToRegister.targetCapacityInMegaWattHour) ||
    deviceGroupToRegister.targetCapacityInMegaWattHour <= 0 ||
    Object.is(deviceGroupToRegister.targetCapacityInMegaWattHour, -0)
  ) {
    throw new ConflictException({
      success: false,
      message:
        'targetCapacityInMegaWattHour should be valid number can include decimal but should be greater than 0',
    });
  }

  [
    'reservationStartDate',
    'reservationEndDate',
    'reservationExpiryDate',
  ].forEach((field) => {
    if (typeof deviceGroupToRegister[field] === 'string') {
      if (!isValidUTCDateFormat(deviceGroupToRegister[field])) {
        throw new ConflictException({
          success: false,
          message: `Invalid ${field}, valid format is  YYYY-MM-DDThh:mm:ss.millisecondsZ example 2022-10-18T11:35:27.640Z`,
        });
      }
      deviceGroupToRegister[field] = new Date(deviceGroupToRegister[field]);
    }
  });

  if (
    deviceGroupToRegister.reservationStartDate &&
    deviceGroupToRegister.reservationEndDate &&
    deviceGroupToRegister.reservationStartDate.getTime() >=
      deviceGroupToRegister.reservationEndDate.getTime()
  ) {
    throw new ConflictException({
      success: false,
      message: 'start date cannot be less than or same as end date',
    });
  }
  if (
    deviceGroupToRegister.reservationStartDate &&
    deviceGroupToRegister.reservationEndDate &&
    deviceGroupToRegister.reservationExpiryDate &&
    (deviceGroupToRegister.reservationExpiryDate.getTime() <=
      deviceGroupToRegister.reservationStartDate.getTime() ||
      deviceGroupToRegister.reservationExpiryDate.getTime() <
        deviceGroupToRegister.reservationEndDate.getTime())
  ) {
    throw new ConflictException({
      success: false,
      message: 'Expiry date cannot be less than from start and end date',
    });
  }

  const maximumBackDateForReservation: Date = new Date(
    new Date().getTime() - 3.164e10 * 3,
  );
  if (
    deviceGroupToRegister.reservationStartDate.getTime() <=
      maximumBackDateForReservation.getTime() ||
    deviceGroupToRegister.reservationEndDate.getTime() <=
      maximumBackDateForReservation.getTime()
  ) {
    throw new ConflictException({
      success: false,
      message:
        'start date or end date cannot be less than 3 year from current date',
    });
  }
  if (organizationId === null || organizationId === undefined) {
    throw new ConflictException({
      success: false,
      message: 'User does not has organization associated',
    });
  }
  const frequency = deviceGroupToRegister.frequency.toLowerCase();
  if (
    frequency === CertificateGenerationFrequency.monthly ||
    frequency === CertificateGenerationFrequency.quarterly ||
    frequency === CertificateGenerationFrequency.weekly
  ) {
    throw new ConflictException({
      success: false,
      message: 'This frequency is currently not supported',
    });
  }
}
