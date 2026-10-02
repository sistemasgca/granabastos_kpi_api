import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { AreaTasksController } from './area-tasks.controller.js';
import { AreaTasksService } from './area-tasks.service.js';

describe('AreaTasksController', () => {
  let controller: AreaTasksController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AreaTasksController],
      providers: [{ provide: AreaTasksService, useValue: {} }],
    }).compile();

    controller = module.get<AreaTasksController>(AreaTasksController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
