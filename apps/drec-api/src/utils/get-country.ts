import { CountryCodeNameDTO } from '../pods/countrycode/dto/country-code.dto';
import { countryCodesList } from '../models/country-code';

export function getCountry(countryCode: string): CountryCodeNameDTO {
  return countryCodesList.find((country) => country.alpha3 === countryCode);
}
