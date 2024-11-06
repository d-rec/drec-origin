import { Unit } from "@energyweb/energy-api-influxdb";

export const convertToUnits = (unit: string): number=>{
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