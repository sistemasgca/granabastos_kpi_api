import { Test, TestingModule } from '@nestjs/testing';
import { AreaTasksService } from './area-tasks.service.js';

describe('AreaTasksService', () => {
  let service: AreaTasksService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AreaTasksService],
    }).compile();

    service = module.get<AreaTasksService>(AreaTasksService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
