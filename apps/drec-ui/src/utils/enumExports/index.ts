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

export enum ReadingsWindowEnum {
    Day = '1h',
    Week = '1d',
    Month = '1w',
    Year = '1mo'
}

export enum TimeUnitPluralEnum {
    milliseconds = 'milliseconds',
    seconds = 'seconds',
    minutes = 'minutes',
    hours = 'hours',
    days = 'days',
    months = 'months',
    years = 'years'
}

export enum DeviceOrderBy {
    OffTaker = 'Offtaker',
    FuelCode = 'Fuel code',
    Country = 'Country',
    StandardCompliance = 'Standard Compliance',
    Sector = 'Sector',
    InstallationConfiguration = 'Installation Configuration',
    GridInterconnection = 'Grid Interconnection',
    Capacity = 'Capacity',
    CommissioningDate = 'Commissioning Date'
}

export enum StandardCompliance {
    IREC = 'I-REC',
    REC = 'REC',
    GO = 'GO',
    TIGR = 'TIGR'
}

export enum Installation {
    StandAlone = 'StandAlone',
    Microgrid = 'Microgrid'
}

export enum OffTaker {
    School = 'School',
    HealthFacility = 'HealthFacility',
    Residential = 'Residential',
    Commercial = 'Commercial',
    Industrial = 'Industrial',
    PublicSector = 'PublicSector'
}

export enum Sector {
    Agriculture = 'Agriculture',
    Manufacturing = 'Manufacturing',
    PublicServices = 'PublicServices',
    Telecom = 'Telecom',
    Residential = 'Residential',
    Mining = 'Mining',
    Education = 'Education',
    Health = 'Health',
    Textiles = 'Textiles',
    Financial = 'Financial'
}

export enum CommissioningDateRange {
    Year_1_Q1 = 'Year1-Q1',
    Year_1_Q2 = 'Year1-Q2',
    Year_1_Q3 = 'Year1-Q3',
    Year_1_Q4 = 'Year1-Q4',
    Year_2 = 'Year2',
    Year_3 = 'Year3',
    Year_4 = 'Year4',
    Year_5 = 'Year5',
    Between_years_6_10 = '6-10years',
    Between_years_11_15 = '11-15years',
    Above_15_years = '15+years'
}

export enum CapacityRange {
    Between_0_50_w = '0-50watts',
    Between_51_500_w = '51-500watts',
    Between_501w_1kw = '501watts-1kW',
    Between_1kw_50kw = '1.001kW-50kW',
    Between_50kw_100kw = '50.001kW-100kW',
    Between_101kw_1mw = '100.001kW-1MW',
    Above_1mw = '1.001MW+'
}
