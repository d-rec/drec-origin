import * as momentTimezone from 'moment-timezone';
import * as momentTimeZone from 'moment-timezone';

export const transformTimezone = (value?: string): string | null => {
  if (!value) return value;
  const allTimezones = momentTimezone.tz.names();
  const index = allTimezones.findIndex(
    (tz: string) => tz.toLowerCase() === value.toLowerCase(),
  );
  return index >= 0 ? allTimezones[index] : value;
};

export const toTimezoneDate = (date: string | Date | null | undefined, timezone: string) => {
  if(!date) return null;

  return momentTimeZone
    .tz(date, timezone)
    .toDate();
};

export const toTimezoneDateFormat = (date: string | Date | null | undefined, timezone: string) => {
  if(!date) return null;

  return momentTimeZone
    .tz(date, timezone)
    .format();
};