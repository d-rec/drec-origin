import { Unit } from '@energyweb/utils-general';

export class PowerFormatter {
    static readonly displayUnit: string = 'kWh';
    static readonly capacityDisplayUnit: string = 'kW';

    static readonly decimalPlaces: number = 3;

    private static formatter = new Intl.NumberFormat('en-US', {
        style: 'decimal',
        minimumFractionDigits: 0,
        maximumFractionDigits: PowerFormatter.decimalPlaces
    });

    static getBaseValueFromValueInDisplayUnit(valueInDisplayUnit: number): number {
        // @ts-ignore
        return valueInDisplayUnit * Unit[PowerFormatter.displayUnit];
    }

    static format(powerInWatt: number, includeDisplayUnit?: boolean): string {
        // @ts-ignore
        return `${PowerFormatter.formatter.format(powerInWatt / Unit[PowerFormatter.displayUnit])}${
            includeDisplayUnit ? ' ' + PowerFormatter.displayUnit : ''
        }`;
    }

    static capacityFormatDisplay(powerInWatt: number, includeDisplayUnit?: boolean): string {
        return `${PowerFormatter.formatter.format(powerInWatt)}${
            includeDisplayUnit ? ' ' + PowerFormatter.capacityDisplayUnit : ''
        }`;
    }

    static formatDisplay(powerInWatt: number, includeDisplayUnit?: boolean): string {
        return `${PowerFormatter.formatter.format(powerInWatt)}${
            includeDisplayUnit ? ' ' + PowerFormatter.displayUnit : ''
        }`;
    }
}
