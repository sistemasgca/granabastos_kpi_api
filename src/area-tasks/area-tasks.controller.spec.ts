import { Test, TestingModule } from '@nestjs/testing';
import { AreaTasksController } from './area-tasks.controller.js';

describe('AreaTasksController', () => {
  let controller: AreaTasksController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AreaTasksController],
    }).compile();

    controller = module.get<AreaTasksController>(AreaTasksController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
