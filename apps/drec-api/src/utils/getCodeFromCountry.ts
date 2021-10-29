import { Countries } from '@energyweb/utils-general';

export const getCodeFromCountry = (countryName: string): string | undefined => {
  if (!countryName) {
    return;
  }
  return Countries.filter((country) => country.name === countryName)[0].code;
};
