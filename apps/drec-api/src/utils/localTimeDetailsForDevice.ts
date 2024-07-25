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
  const logger = new Logger('getLocalTime');
  const point = [parseFloat(device.longitude), parseFloat(device.latitude)];
  logger.log(`latitude is:::: + ${device.latitude}`);
  logger.log(`longitue is::: + ${device.longitude}`);
  logger.log(`point is::: + ${point}`);
  const timestamp = new Date(startDate);
  const localTime = mapBoxTimeSpace
    .getFuzzyLocalTimeFromPoint(timestamp, point)
    .startOf('day');
  logger.log(`localTime Time: ${localTime.utc().format()}`);
  return localTime;
};

export const getLocalTimeZoneFromDevice = (
  localTime: Date,
  device: DeviceDTO,
): any => {
  const logger = new Logger('getLocalTimeZoneFromDevice');
  if (device.timezone) {
    logger.log('timezone is there');
    logger.log(`DEVICE TIMEZONE BEING RETURNED: ${device.timezone}`);
    return device.timezone;
  } else if (device.longitude && device.latitude && localTime) {
    try {
      logger.log('lat and long are there');
      const timestamp = new Date(localTime);
      const point = [parseFloat(device.longitude), parseFloat(device.latitude)];
      const time = mapBoxTimeSpace.getFuzzyLocalTimeFromPoint(timestamp, point);
      logger.log(`TIME::::::::::::::::: + ${time}`);
      const actualTimeZone = momentTimeZone.tz.names().find((timezone) => {
        if (momentTimeZone.tz(timezone).zoneAbbr() == time.zoneAbbr()) {
          logger.log(`TIMEZONE THAT's BEING RETURNED::: + ${timezone}`);
          return timezone;
        }
      });
      return actualTimeZone;
    } catch {
      const countryCodeFound: CountryCodeNameDTO = countryCodesList.find(
        (entry) => entry.countryCode === device.countryCode,
      );

      return countryCodeFound.timezones[0].name;
    }
  } else {
    logger.log('only country code');
    const countryCodeFound: CountryCodeNameDTO = countryCodesList.find(
      (entry) => entry.countryCode === device.countryCode,
    );

    return countryCodeFound.timezones[0].name;
  }
};

export const getOffsetFromTimeZoneName = (givenTimeZone: string | any): any => {
  const logger = new Logger('getOffsetFromTimeZoneName');
  logger.log(`given timezone::::::::;; + ${givenTimeZone}`);
  let matchingTimezone;
  for (let i = 0; i < countryCodesList.length; i++) {
    const elementTimeZone = countryCodesList[i].timezones;
    for (let j = 0; j < elementTimeZone.length; j++) {
      if (elementTimeZone[j].name === givenTimeZone) {
        logger.log(
          `FOUND A MATCHING TIMEZONE IN THE LOOPS:::: +
            ${elementTimeZone[j].name},`,
        );
        matchingTimezone = elementTimeZone[j];
        break;
      } else {
        continue;
      }
    }
  }

  logger.log(`matching timezone object::::::; + ${matchingTimezone}`);
  logger.log(`matching timezone name:::::::' + ${matchingTimezone.name}`);
  const offset = matchingTimezone.offset;
  logger.log(`matching OFFSET::::::: + ${offset}`);
  return offset;
};

export const getFormattedOffSetFromOffsetAsJson = (
  givenOffSet: number | any,
): {
  hours: number;
  minutes: number;
} => {
  const logger = new Logger('getFormattedOffSetFromOffsetAsJson');
  logger.log(`given offset::: + ${givenOffSet}`);

  let hours = Math.floor(Math.abs(givenOffSet) / 60);

  const minutes = Math.abs(givenOffSet % 60);

  if (givenOffSet < 0) {
    hours = -1 * hours;
  }

  logger.log(`OFFSET hours FROM UTILS FUNCTOIN: ${hours}`);

  logger.log(`OFFSET hours FROM UTILS FUNCTOIN: ${minutes}`);

  const formattedJson = {
    hours: hours,

    minutes: minutes,
  };

  return formattedJson;
};
