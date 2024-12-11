import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { countryCodesList } from '../models/country-code';

@ValidatorConstraint({ async: false })
export class IsValidCountryCodeConstraint
  implements ValidatorConstraintInterface
{

  validate(value: string, args: ValidationArguments): boolean {
    return countryCodesList.some(
      (country) => country.countryCode === value,
    );
  }

  defaultMessage(args: ValidationArguments): string {
    return `Invalid countryCode, some of the valid country codes are "GBR" - "United Kingdom", "CAN" - "Canada", "IND" - "India", "DEU" - "Germany"`;
  }
}

export function IsValidCountryCode(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidCountryCodeConstraint,
    });
  };
}
