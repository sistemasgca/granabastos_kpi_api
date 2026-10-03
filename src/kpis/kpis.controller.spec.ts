import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { KpisController } from './kpis.controller.js';
import { KpisService } from './kpis.service.js';

describe('KpisController', () => {
  let controller: KpisController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [KpisController],
      providers: [{ provide: KpisService, useValue: {} }],
    }).compile();

    controller = module.get<KpisController>(KpisController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
