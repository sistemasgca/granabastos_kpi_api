import { Test, TestingModule } from '@nestjs/testing';
import { KpiTasksService } from './kpi-tasks.service.js';

describe('KpiTasksService', () => {
  let service: KpiTasksService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [KpiTasksService],
    }).compile();

    service = module.get<KpiTasksService>(KpiTasksService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
