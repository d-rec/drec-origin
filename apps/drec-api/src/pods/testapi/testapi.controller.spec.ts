import { Test, TestingModule } from '@nestjs/testing';
import { TestapiController } from './testapi.controller';
import { TestapiService } from './testapi.service';

describe('TestapiController', () => {
  let controller: TestapiController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TestapiController],
      providers: [TestapiService],
    }).compile();

    controller = module.get<TestapiController>(TestapiController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
