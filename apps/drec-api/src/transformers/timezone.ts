import * as momentTimezone from 'moment-timezone';


export const transformTimezone = (value?: string): string | null => {
    if (!value) return value;
    const allTimezones = momentTimezone.tz.names();
    const index = allTimezones.findIndex(
        (tz: string) => tz.toLowerCase() === value.toLowerCase(),
    );
    return index >= 0 ? allTimezones[index] : value;
};
