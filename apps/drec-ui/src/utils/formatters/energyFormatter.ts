import { Unit } from '@energyweb/utils-general';
import { BigNumber, BigNumberish } from '@ethersproject/bignumber';
import { commify } from '@ethersproject/units';

export class EnergyFormatter {
    public static readonly displayUnit = 'MWh';
    public static readonly decimalPlaces = 3;

    public static readonly energyFormatUnit = 'kWh';

    private static formatter = new Intl.NumberFormat('en-US', {
        style: 'decimal',
        minimumFractionDigits: 0,
        maximumFractionDigits: EnergyFormatter.decimalPlaces
    });

    static getValueInDisplayUnit(baseValue: BigNumberish): number {
        const valueBN = BigNumber.from(baseValue);

        const whole = valueBN.div(Unit[EnergyFormatter.displayUnit]);
        const mod = valueBN.mod(Unit[EnergyFormatter.displayUnit]);

        return parseFloat(`${whole}.${mod.toString().slice(0, EnergyFormatter.decimalPlaces)}`);
    }

    static getMegawattsFromWatts(baseValue: BigNumberish) {
        // Max allowed number is 9007199254740990
        const valueBN = BigNumber.from(baseValue);
        const wholeKw = valueBN.div(Unit[EnergyFormatter.energyFormatUnit]).toNumber(); // This is now in kW
        const result = wholeKw / Unit[EnergyFormatter.energyFormatUnit]; // Tranforming it to MWh
        return EnergyFormatter.formatter.format(result);
    }

    static getBaseValueFromValueInDisplayUnit(valueInDisplayUnit: number): BigNumber {
        return BigNumber.from(valueInDisplayUnit).mul(Unit[EnergyFormatter.displayUnit]);
    }

    static format(baseValue: BigNumberish, includeDisplayUnit?: boolean): string {
        const commifiedValue = commify(
            String(EnergyFormatter.getValueInDisplayUnit(BigNumber.from(baseValue)))
        );
        return String(commifiedValue).concat(
            includeDisplayUnit ? ` ${EnergyFormatter.displayUnit}` : ''
        );
    }
}
