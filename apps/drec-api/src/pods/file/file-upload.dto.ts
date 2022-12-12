import { ApiProperty } from '@nestjs/swagger';

export class FileUploadDto {
  @ApiProperty({ type: 'string', format: 'binary', isArray: true })
  files: Blob[];
  type?:string;
}
