import { Transform } from 'class-transformer';
import { IsNotEmpty } from 'class-validator';

export class MeterReadFileDto implements Express.Multer.File {
  @IsNotEmpty()
  @Transform(({ value }) => {
    if (!value.mimetype.includes('csv')) {
      throw new Error('Only CSV files are allowed');
    }
    return value;
  })
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  stream: any;
  destination: string;
  filename: string;
  path: string;
  buffer: Buffer;
}
