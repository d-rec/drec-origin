import {
  IsEthereumAddress,
  IsNumber,
  IsOptional,
  Min,
  validate,
  validateOrReject,
} from 'class-validator';
import { plainToClass } from 'class-transformer';
import { validatorOptions } from './validator.config';
import { IClaimData } from '@energyweb/issuer';
import { IClaimCommand } from '../../../../../types/utils/issuer';
import { IsEnergyValue } from './decorators/is-energy-value';

export const validateClaimCommand = async (command: IClaimCommand) =>
  await validateOrReject(
    plainToClass(ClaimCommandDto, command),
    validatorOptions,
  );

export const validateBatchClaimCommands = async (commands: IClaimCommand[]) => {
  const validationErrors = await Promise.all(
    commands.map((command) => validate(plainToClass(ClaimCommandDto, command))),
  );

  if (validationErrors.every((errors) => errors.length === 0)) {
    return;
  }

  throw validationErrors;
};

class ClaimCommandDto implements IClaimCommand {
  @IsNumber()
  @Min(0)
  certificateId: number;

  claimData: IClaimData;

  @IsEthereumAddress()
  forAddress: string;

  @IsOptional()
  @IsEnergyValue()
  energyValue: string;
}
