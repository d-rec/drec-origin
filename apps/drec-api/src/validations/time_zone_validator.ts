import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface
} from 'class-validator';
import * as momentTimezone from 'moment-timezone';

@ValidatorConstraint({ async: false })
export class IsValidTimezoneConstraint implements ValidatorConstraintInterface {
  validate(timezone: any) {
    const allTimezoneNames = momentTimezone.tz.names().map(tz => tz.toLowerCase());
    return typeof timezone === 'string' && allTimezoneNames.includes(timezone.toLowerCase());
  }

  defaultMessage() {
    return `Timezone ($value) is not valid.`;
  }
}

export function IsValidTimezone(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidTimezoneConstraint,
    });
  };
}
