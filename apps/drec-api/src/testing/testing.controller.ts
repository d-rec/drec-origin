import { Controller, Delete } from '@nestjs/common';
import { TestingService } from '../testing/testing.service';


@Controller('testing')
export class TestingController {
  constructor(private readonly testingService: TestingService) {}

  @Delete('clear-db')
  async clearDatabase() {
    try {
      await this.testingService.clearDatabase();
      return { message: 'Database cleared successfully' };
    } catch (error) {
      return { message: 'Failed to clear database', error: error.message };
    }
  }
}