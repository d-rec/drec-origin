import { Injectable } from '@nestjs/common';
import { CreateTestapiDto } from './dto/create-testapi.dto';
import { UpdateTestapiDto } from './dto/update-testapi.dto';

@Injectable()
export class TestapiService {
  create(createTestapiDto: CreateTestapiDto) {
    return 'This action adds a new testapi';
  }

  findAll() {
    return `This action returns all testapi`;
  }

  findOne(id: number) {
    return `This action returns a #${id} testapi`;
  }

  update(id: number, updateTestapiDto: UpdateTestapiDto) {
    return `This action updates a #${id} testapi`;
  }

  remove(id: number) {
    return `This action removes a #${id} testapi`;
  }
}
