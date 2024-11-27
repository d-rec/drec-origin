import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

export function IsValidCommissioningDate(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isValidCommissioningDate',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (!value) return false;
          
          // Check UTC format
          const utcRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
          if (!utcRegex.test(value)) return false;
          
          // Check if date is not in future
          const commissioningDate = new Date(value);
          const currentDate = new Date();
          
          return commissioningDate.getTime() <= currentDate.getTime();
        },
        defaultMessage(args: ValidationArguments) {
          const currentValue = args.value;
          if (!currentValue) return 'Commissioning date is required';
          
          const utcRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
          if (!utcRegex.test(currentValue)) {
            return 'Invalid commissioning date format. Required format: YYYY-MM-DDThh:mm:ss.millisecondsZ';
          }
          
          return 'Commissioning date cannot be in the future';
        }
      }
    });
  };
}
