import { Unit } from "@energyweb/energy-api-influxdb";

export const convertToUnits = (measurement: number, unit: string): number=>{
    switch (unit) {
      case Unit.Wh:
        return 1;
      case Unit.kWh:
        return (10 ** 3) * measurement;
      case Unit.MWh:
        return (10 ** 6) * measurement;
      case Unit.GWh:
        return (10 ** 9) * measurement;
    }
}