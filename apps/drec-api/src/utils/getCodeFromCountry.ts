//import { Countries } from '@energyweb/utils-general';
import {countryCodesList} from '../models/country-code'
export const getCodeFromCountry = (countryName: string): string | undefined => {
 
  if (!countryName) {
    return;
  }
  
  return countryCodesList.filter((country) => country.countryCode === countryName)[0]?.countryCode;
};
