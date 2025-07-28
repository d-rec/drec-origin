import * as mapBoxTimeSpace from '@mapbox/timespace';
import * as momentTimeZone from 'moment-timezone';
import { countryCodesList } from '../models/country-code';
import { CountryCodeNameDTO } from '../pods/countrycode/dto';
import { Logger } from '@nestjs/common';
import { Device } from '../pods/device/device.entity';
import { DeviceDTO } from '../pods/device/dto';

export const getLocalTime = (
  startDate: string | any | Date,
  device: Device,
): any => {
  const point = [parseFloat(device.longitude), parseFloat(device.latitude)];
  const timestamp = new Date(startDate);
  const localTime = mapBoxTimeSpace
    .getFuzzyLocalTimeFromPoint(timestamp, point)
    .startOf('day');
  return localTime;
};

export const getLocalTimeZoneFromDevice = (
  localTime: Date,
  device: DeviceDTO,
): any => {
  const logger = new Logger('getLocalTimeZoneFromDevice');
  if (device.timezone) {
    return device.timezone;
  }
  if (device.longitude && device.latitude && localTime) {
    try {
      const timestamp = new Date(localTime);
      const point = [parseFloat(device.longitude), parseFloat(device.latitude)];
      const time = mapBoxTimeSpace.getFuzzyLocalTimeFromPoint(timestamp, point);
      return momentTimeZone.tz.names().find((timezone) => {
        if (momentTimeZone.tz(timezone).zoneAbbr() == time.zoneAbbr()) {
          return timezone;
        }
      });
    } catch (e) {
      logger.debug(e);
    }
  }

  const countryCodeFound: CountryCodeNameDTO = countryCodesList.find(
    (entry) => entry.countryCode === device.countryCode,
  );

  return countryCodeFound.timezones[0].name;
};

export const getOffsetFromTimeZoneName = (givenTimeZone: string | any): any => {
  let matchingTimezone;
  for (let i = 0; i < countryCodesList.length; i++) {
    const elementTimeZone = countryCodesList[i].timezones;
    for (let j = 0; j < elementTimeZone.length; j++) {
      if (elementTimeZone[j].name === givenTimeZone) {
        matchingTimezone = elementTimeZone[j];
        break;
      }
    }
  }

  const offset = matchingTimezone.offset;
  return offset;
};

export const getFormattedOffSetFromOffsetAsJson = (
  givenOffSet: number | any,
): {
  hours: number;
  minutes: number;
} => {
  let hours = Math.floor(Math.abs(givenOffSet) / 60);

  const minutes = Math.abs(givenOffSet % 60);

  if (givenOffSet < 0) {
    hours = -1 * hours;
  }

  const formattedJson = {
    hours: hours,

    minutes: minutes,
  };

  return formattedJson;
};
