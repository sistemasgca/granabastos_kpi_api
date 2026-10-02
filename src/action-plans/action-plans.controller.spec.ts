import { Test, TestingModule } from '@nestjs/testing';
import { ActionPlansController } from './action-plans.controller.js';

describe('ActionPlansController', () => {
  let controller: ActionPlansController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ActionPlansController],
    }).compile();

    controller = module.get<ActionPlansController>(ActionPlansController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
