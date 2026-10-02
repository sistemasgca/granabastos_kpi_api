import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { KpiTasksController } from './kpi-tasks.controller.js';
import { KpiTasksService } from './kpi-tasks.service.js';

describe('KpiTasksController', () => {
  let controller: KpiTasksController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [KpiTasksController],
      providers: [{ provide: KpiTasksService, useValue: {} }],
    }).compile();

    controller = module.get<KpiTasksController>(KpiTasksController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
