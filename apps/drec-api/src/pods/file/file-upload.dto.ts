import { ApiProperty } from '@nestjs/swagger';

export class FileUploadDTO {
  @ApiProperty({ type: 'blob', format: 'binary', isArray: true })
  files: Blob[];
  type?: string;
}
