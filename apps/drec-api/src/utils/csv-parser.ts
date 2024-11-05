import { MeasurementDTO, ReadDTO, Unit } from "@energyweb/energy-api-influxdb";
import { File } from '../pods/file/file.entity';
import { NewReadDTO } from "src/models";
import { NewIntmediateMeterReadDTO } from "src/pods/reads/dto/intermediate_meter_read.dto";
import { ReadType} from "./enums/read-type.enum";

export function parseCsvContent(file: File): NewIntmediateMeterReadDTO[] {
  const content = file.toString();
  const lines = content.split('\n');

  const dataRows = lines.slice(1);

  return dataRows
    .map(row => {
      const [organizationId, reads, type, unit, starttimestamp, value] = row.split(',');

      return {
        organizationId: parseInt(organizationId), 
        type: type as ReadType, 
        unit: unit as Unit, 
        reads: [{
          starttimestamp: new Date(starttimestamp), 
          value: parseFloat(value) 
        }] as NewReadDTO[], 
      } as NewIntmediateMeterReadDTO;
    })
    .filter(reading => 
      reading.organizationId && 
      reading.type && 
      reading.unit && 
      reading.reads[0]?.starttimestamp && 
      reading.reads[0]?.value !== undefined
    );
}
