import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import * as momentTimezone from 'moment-timezone';

@ValidatorConstraint({ async: false })
export class IsValidTimezoneConstraint implements ValidatorConstraintInterface {
  validate(timezone: string, args: ValidationArguments): boolean {
    const allTimezoneNames = momentTimezone.tz.names();
    const allTimezoneNamesLowerCase = allTimezoneNames.map((tz) =>
      tz.toLowerCase(),
    );
    const isValid =
      typeof timezone === 'string' &&
      allTimezoneNamesLowerCase.includes(timezone.toLowerCase());

    if (isValid) {
      const correctIndex = allTimezoneNamesLowerCase.findIndex(
        (tz) => tz === timezone.toLowerCase(),
      );
      (args.object as any)[args.property] = allTimezoneNames[correctIndex];
    }

    return isValid;
  }
}

export function IsValidTimezone(validationOptions?: ValidationOptions) {
  return function (
    object: Record<string, unknown>,
    propertyName: string,
  ): void {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: {
        ...validationOptions,
        message: (args: ValidationArguments) => {
          const value = args.value;
          return `Invalid timezone: ${value}. Timezone must follow the format {Continent}/{City}. Examples: America/New_York, Europe/London, Asia/Tokyo`;
        },
      },
      constraints: [],
      validator: IsValidTimezoneConstraint,
    });
  };
}
