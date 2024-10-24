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
  validate(timezone: string): boolean {
    const allTimezoneNames = momentTimezone.tz
      .names()
      .map((tz) => tz.toLowerCase());
    return (
      typeof timezone === 'string' &&
      allTimezoneNames.includes(timezone.toLowerCase())
    );
  }

  defaultMessage(): string {
    return `Timezone ($value) is not valid.`;
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
          return `Invalid timezone: ${value}. Please provide a valid timezone if you include it.`;
        },
      },
      constraints: [],
      validator: IsValidTimezoneConstraint,
    });
  };
}
