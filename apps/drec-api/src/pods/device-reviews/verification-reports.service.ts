import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VerificationReport } from './verification-report.entity';

@Injectable()
export class VerificationReportsService {
  constructor(
    @InjectRepository(VerificationReport)
    private readonly repo: Repository<VerificationReport>,
  ) {}

  async create(
    deviceId: number,
    createdByEmail: string,
    createdByName: string | null,
    elapsedMs: number,
    overallStatus: string | null,
    payload: Record<string, any>,
  ): Promise<VerificationReport> {
    const row = this.repo.create({
      deviceId,
      createdByEmail,
      createdByName,
      elapsedMs,
      overallStatus,
      payload,
    });
    return this.repo.save(row);
  }

  async findById(id: number): Promise<VerificationReport> {
    const row = await this.repo.findOne({ where: { id } });
    if (!row) {
      throw new NotFoundException(`Verification report ${id} not found`);
    }
    return row;
  }

  async listForDevice(deviceId: number): Promise<VerificationReport[]> {
    return this.repo.find({
      where: { deviceId },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }
}
