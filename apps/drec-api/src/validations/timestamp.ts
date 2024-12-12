import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import moment from 'moment';

const supportedFormats = [
  'YYYY-MM-DD HH:mm:ss',
  'YYYY-MM-DD HH:mm:ss.SSS',
  'YYYY-MM-DD HH:mm:ss.SS',
  'YYYY-MM-DD HH:mm:ss.S',
];

@ValidatorConstraint({ async: false })
export class IsValidTimestampConstraint
  implements ValidatorConstraintInterface
{
  validate(value: string): boolean {
    return supportedFormats.some((format) =>
      moment(value, format, true).isValid(),
    );
  }

  defaultMessage(args: ValidationArguments): string {
    return `Invalid date format for ${args.property}. Expected format: YYYY-MM-DD hh:mm:ss (with optional milliseconds). Please ensure it's valid in the timezone.`;
  }
}

export function IsTimestamp(validationOptions?: ValidationOptions) {
  return function (object: Record<string, any>, propertyName: string): void {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidTimestampConstraint,
    });
  };
}
