import { Test, TestingModule } from '@nestjs/testing';
import { ActionPlansService } from './action-plans.service.js';

describe('ActionPlansService', () => {
  let service: ActionPlansService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ActionPlansService],
    }).compile();

    service = module.get<ActionPlansService>(ActionPlansService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
