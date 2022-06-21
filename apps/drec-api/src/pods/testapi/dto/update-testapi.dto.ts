import { PartialType } from '@nestjs/swagger';
import { CreateTestapiDto } from './create-testapi.dto';

export class UpdateTestapiDto extends PartialType(CreateTestapiDto) {}
