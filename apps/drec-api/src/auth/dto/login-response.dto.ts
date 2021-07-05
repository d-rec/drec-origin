import { ApiProperty } from '@nestjs/swagger';

export class LoginResponseDTO {
  @ApiProperty({
    type: String,
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoiTGVib3dza2kgRW5lcmd5IENvbXBhbnkiLCJzdWIiOjg3Njg3Njg2LCJpYXQiOjE2MDc2OTAwMDIsImV4cCI6MTYwODI5NDgwMn0.-anQctm5ORU7d_GNXJZ7SWDnhqDE8KkiNgIb-x-_lV8',
  })
  accessToken: string;
}
