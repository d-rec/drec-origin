import { Controller, Get } from '@nestjs/common';
import { EvidentService } from './evident.controller.service';

@Controller('evident')
export class EvidentController {
  constructor(private readonly evidentService: EvidentService) {}

  @Get('test-auth')
  async testAuth() {
    const token = await this.evidentService.getAuthToken();
    await this.evidentService.storeAuthToken(token);
    return { token };
  }

  @Get('devices')
  async getDevices() {
    const devices = await this.evidentService.fetchDevices();
    return { devices };
  }
}