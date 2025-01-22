import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import * as momentTimezone from 'moment-timezone';
import { transformTimezone } from '../transformers/timezone';

const errorMessage = `Invalid timezone: $value. Timezone must follow the format {Continent}/{City}. Examples: America/New_York, Europe/London, Asia/Tokyo`;

@ValidatorConstraint({ async: false })
export class IsValidTimezoneConstraint implements ValidatorConstraintInterface {
  validate(timezone: string): boolean {
    return isTimezoneValid(timezone);
  }
}
export function IsValidTimezone(validationOptions?: ValidationOptions) {
  return function (object: Record<string, any>, propertyName: string): void {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: {
        message: errorMessage,
        ...validationOptions,
      },
      constraints: [],
      validator: IsValidTimezoneConstraint,
    });
  };
}

const isTimezoneValid = (timezone: string): boolean => {
  const allTimezoneNames = momentTimezone.tz
    .names()
    .map((tz) => tz.toLowerCase());
  return (
    typeof timezone === 'string' &&
    allTimezoneNames.includes(timezone.toLowerCase())
  );
};

export const validateTimezone = (timezone: string): string | never => {
  if (isTimezoneValid(timezone)) {
    return transformTimezone(timezone);
  }
  throw new Error(errorMessage);
};
