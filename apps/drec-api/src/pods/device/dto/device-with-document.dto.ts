import { ApiProperty } from "@nestjs/swagger";
import { NewDeviceDTO } from "./new-device.dto";

export class RegisterDeviceFormDTO {
    @ApiProperty({ type: 'string', format: 'binary' })
    productionFacilityRegistration: any;
  
    @ApiProperty({ type: 'string', format: 'binary' })
    ownershipProof: any;
  
    @ApiProperty({ type: 'string', format: 'binary' })
    meteringEvidence: any;
  
    @ApiProperty({ type: 'string', format: 'binary' })
    singleLineDiagram: any;
  
    @ApiProperty({ type: 'string', format: 'binary' })
    projectPhotos: any;
  }
  