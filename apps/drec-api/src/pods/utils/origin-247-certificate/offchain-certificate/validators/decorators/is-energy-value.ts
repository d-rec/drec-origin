import {
    registerDecorator,
    ValidationArguments,
    ValidationOptions,
    ValidatorConstraint,
    ValidatorConstraintInterface
} from 'class-validator';
import { BigNumber } from 'ethers';

@ValidatorConstraint({ name: 'isEnergyValue' })
export class IsEnergyValueConstraint implements ValidatorConstraintInterface {
    public validate(value: string) {
        try {
            const isNegative = BigNumber.from(value).isNegative();

            return !isNegative;
        } catch (e) {
            return false;
        }
    }

    public defaultMessage(args: ValidationArguments) {
        return `"${args.value}" is not valid energy volume`;
    }
}

export function IsEnergyValue(validationOptions?: ValidationOptions) {
    return (object: Object, propertyName: string) => {
        registerDecorator({
            name: 'isEnergyValue',
            target: object.constructor,
            propertyName,
            constraints: [propertyName],
            options: validationOptions,
            validator: IsEnergyValueConstraint
        });
    };
}
