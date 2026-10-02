import { Test, TestingModule } from '@nestjs/testing';
import { KpiTasksController } from './kpi-tasks.controller.js';

describe('KpiTasksController', () => {
  let controller: KpiTasksController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [KpiTasksController],
    }).compile();

    controller = module.get<KpiTasksController>(KpiTasksController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
