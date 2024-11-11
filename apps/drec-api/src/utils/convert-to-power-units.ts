import { Unit } from "@energyweb/energy-api-influxdb";

export const getWattMultiplier = (unit: string) => {
    switch (unit) {
        case Unit.Wh:
            return 1;
        case Unit.kWh:
            return 10 ** 3;
        case Unit.MWh:
            return 10 ** 6;
        case Unit.GWh:
            return 10 ** 9;
    }
}

// Convert to Watt per Hour
export const convertToWh = (measurement: number, unit: string): number => {
    const multiplier = getWattMultiplier(unit) || 1;

    return measurement * multiplier;
}