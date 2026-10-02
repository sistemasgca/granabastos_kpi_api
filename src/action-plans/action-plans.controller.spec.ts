import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { ActionPlansController } from './action-plans.controller.js';
import { ActionPlansService } from './action-plans.service.js';

describe('ActionPlansController', () => {
  let controller: ActionPlansController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ActionPlansController],
      providers: [{ provide: ActionPlansService, useValue: {} }],
    }).compile();

    controller = module.get<ActionPlansController>(ActionPlansController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
