import * as mapBoxTimeSpace from '@mapbox/timespace';
import * as momentTimeZone from 'moment-timezone';
import { countryCodesList } from '../models/country-code';
import { CountryCodeNameDTO } from '../pods/countrycode/dto';
import { Logger } from '@nestjs/common';
import { DeviceDTO } from '../pods/device/dto';

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
