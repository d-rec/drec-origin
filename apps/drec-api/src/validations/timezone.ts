import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import * as momentTimezone from 'moment-timezone';

@ValidatorConstraint({ async: false })
export class IsValidTimezoneConstraint implements ValidatorConstraintInterface {
  validate(timezone: string): boolean {
    const allTimezoneNames = momentTimezone.tz
      .names()
      .map((tz) => tz.toLowerCase());
    return (
      typeof timezone === 'string' &&
      allTimezoneNames.includes(timezone.toLowerCase())
    );
  }
}
export function IsValidTimezone(validationOptions?: ValidationOptions) {
  return function (object: Record<string, any>, propertyName: string): void {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: {
        message: `Invalid timezone: $value. Timezone must follow the format {Continent}/{City}. Examples: America/New_York, Europe/London, Asia/Tokyo`,
        ...validationOptions,
      },
      constraints: [],
      validator: IsValidTimezoneConstraint,
    });
  };
}
