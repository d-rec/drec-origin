export const AUTHENTICATION_TOKEN = 'AUTHENTICATION_TOKEN';
export const THEME_MODE = 'THEME_MODE';

export enum Unit {
    kW = 'kW',
    kWh = 'kWh',
    MW = 'MW',
    MWh = 'MWh',
    GW = 'GW',
    GWh = 'GWh'
}

export enum EnergyTypeEnum {
    SOLAR = 'solar'
}

export enum DateFormatEnum {
    DATE_FORMAT_MDY = 'MMM D, YYYY',
    DATE_FORMAT_DMY = 'DD/MM/YYYY',
    DATE_FORMAT_MONTH_AND_YEAR = 'MMM, YYYY',
    DATE_FORMAT_FULL_YEAR = 'YYYY',
    DATE_FORMAT_INCLUDING_TIME = `MMM D, YYYY hh:mm a`
}

export enum EmailConfirmationResponse {
    Success = 'Email confirmed successfully',
    AlreadyConfirmed = 'Email already confirmed',
    Expired = 'Email confirmation token expired'
}
