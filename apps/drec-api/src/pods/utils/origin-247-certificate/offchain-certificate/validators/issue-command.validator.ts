import { IIssueCommand } from '../../../../../types/utils/issuer';
import {
    IsEthereumAddress,
    IsNotEmpty,
    IsNumber,
    IsString,
    Min,
    validate,
    validateOrReject
} from 'class-validator';
import { plainToClass } from 'class-transformer';
import { IsEnergyValue } from './decorators/is-energy-value';
import { validatorOptions } from './validator.config';

export const validateIssueCommand = async <T>(command: IIssueCommand<T>) =>
    await validateOrReject(plainToClass(IssueCommandDto, command), validatorOptions);

export const validateBatchIssueCommands = async <T>(commands: IIssueCommand<T>[]) => {
    const validationErrors = await Promise.all(
        commands.map((command) => validate(plainToClass(IssueCommandDto, command)))
    );

    if (validationErrors.every((errors) => errors.length === 0)) {
        return;
    }

    throw validationErrors;
};

class IssueCommandDto implements IIssueCommand<any> {
    @IsEthereumAddress()
    toAddress: string;

    @IsString()
    @IsNotEmpty()
    userId: string;

    @IsEnergyValue()
    energyValue: string;

    @IsNumber()
    @Min(0)
    fromTime: number;

    @IsNumber()
    @Min(0)
    toTime: number;

    @IsString()
    @IsNotEmpty()
    deviceId: string;

    metadata: any;
}
