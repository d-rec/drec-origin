import { ValidatorOptions } from 'class-validator';

export const validatorOptions: ValidatorOptions = {
    forbidUnknownValues: true,
    validationError: {
        target: false,
        value: true
    }
};
