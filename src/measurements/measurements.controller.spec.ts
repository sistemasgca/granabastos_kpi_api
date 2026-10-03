import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { MeasurementsController } from './measurements.controller.js';
import { MeasurementsService } from './measurements.service.js';

describe('MeasurementsController', () => {
  let controller: MeasurementsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MeasurementsController],
      providers: [{ provide: MeasurementsService, useValue: {} }],
    }).compile();

    controller = module.get<MeasurementsController>(MeasurementsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
