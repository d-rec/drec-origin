import { countryCodesList } from '../models/country-code';

export function getCountryCodeAlpha2(countryCode: string): string {
  const country = countryCodesList.find(
    (country) => country.alpha3 === countryCode,
  );
  return country ? country.alpha2 : countryCode;
}
