import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

export function IsValidCommissioningDate(
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  return function (object: unknown, propertyName: string) {
    registerDecorator({
      name: 'isValidCommissioningDate',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: string) {
          if (!value) return false;

          const commissioningDate = new Date(value);
          const currentDate = new Date();

          return commissioningDate.getTime() <= currentDate.getTime();
        },
        defaultMessage(args: ValidationArguments) {
          const currentValue = args.value;
          if (!currentValue) return 'Commissioning date is required';
          return 'Commissioning date cannot be in the future';
        },
      },
    });
  };
}
