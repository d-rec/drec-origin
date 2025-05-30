import { Injectable } from "@nestjs/common";
import { DeviceService } from "../device";
import { mapMeterReads } from "../../lib/influx-db";

@Injectable()
export class MigrateInfluxDBReads{
    constructor(
        private deviceService: DeviceService,
    ){}

    async getDeviceByRead(){
        try{
            const reads = await mapMeterReads();
            if (reads.length === 0) return null;
            const readExternalId = reads[10].externalId;
            console.log(`Fetching device for read with externalId: ${readExternalId}`);
            const device = await this.deviceService.findDeviceByExternalId(readExternalId);
            if (device) {
                console.log(`Device found: ${device.id}`);
                reads[0].startDate = device.createdAt;
                console.log(`Updated read startDate to device createdAt: ${device.createdAt}`);
                console.log(reads)
            } else {
                console.log(`No device found for read with externalId: ${readExternalId}`);
            }
        }
        catch (error) {
            console.error("Error fetching device by read:", error);
            throw error;
        }
    }
}