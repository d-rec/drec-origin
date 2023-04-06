//import { Countries } from '@energyweb/utils-general';
import {countrCodesList} from '../models/country-code'
export const getCodeFromCountry = (countryName: string): string | undefined => {
 
  if (!countryName) {
    return;
  }
  
  return countrCodesList.filter((country) => country.countryCode === countryName)[0]?.countryCode;
};
