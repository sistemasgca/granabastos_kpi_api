import { Controller, Get } from '@nestjs/common';
import { AlertsService } from './alerts.service.js';

@Controller('alerts')
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Get()
  findAll() {
    return this.alertsService.findAll();
  }
}
