import { Unit } from '@energyweb/utils-general';
import { BigNumber } from '@ethersproject/bignumber';
import { BigNumber as BigNumberEthers } from 'ethers';

export class PowerFormatter {
    static readonly displayUnit: string = 'kWh';
    static readonly capacityDisplayUnit: string = 'kW';

    static readonly decimalPlaces: number = 3;

    private static formatter = new Intl.NumberFormat('en-US', {
        style: 'decimal',
        minimumFractionDigits: 0,
        maximumFractionDigits: PowerFormatter.decimalPlaces
    });

    static getBaseValueFromValueInDisplayUnit(valueInDisplayUnit: number): string {
        return BigNumber.from(valueInDisplayUnit)
            .mul(Unit[PowerFormatter.displayUnit as keyof typeof Unit])
            .toString();
    }

    static getBaseValueFromValueInDisplayUnitInEthers(amount): string {
        //@ts-ignore
        return BigNumberEthers.from(PowerFormatter.getBaseValueFromValueInDisplayUnit(Number(amount))
        );
    }

    static format(powerInWatt: number, includeDisplayUnit?: boolean): string {
        if (!powerInWatt) {
            const result = includeDisplayUnit ? `0 ${PowerFormatter.displayUnit}` : '0';
            return result;
        }
        return `${PowerFormatter.formatter.format(
            BigNumber.from(powerInWatt)
                .div(Unit[PowerFormatter.displayUnit as keyof typeof Unit])
                .toNumber()
        )}${includeDisplayUnit ? ' ' + PowerFormatter.displayUnit : ''}`;
    }

    static capacityFormatDisplay(powerInWatt: number, includeDisplayUnit?: boolean): string {
        // @ts-ignore
        return `${PowerFormatter.formatter.format(powerInWatt / Unit[PowerFormatter.displayUnit])}${
            includeDisplayUnit ? ' ' + PowerFormatter.capacityDisplayUnit : ''
        }`;
    }
}
