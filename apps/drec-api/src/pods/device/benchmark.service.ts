import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { performance } from 'perf_hooks';
import { DeviceLateOngoingIssueCertificateEntity } from './device_lateongoing_certificate.entity';

@Injectable()
export class BenchmarkService {
  constructor(
    @InjectRepository(DeviceLateOngoingIssueCertificateEntity)
    private readonly cycleRepository: Repository<DeviceLateOngoingIssueCertificateEntity>,
  ) {
  }

  async benchmarkSelect(limit?: number): Promise<void> {
    const start = performance.now();

    const results = await this.cycleRepository.find(
      {
        select: ['id', 'device_externalid', 'late_start_date', 'late_end_date', 'certificate_issued'],
        take: limit,
      }
    );
    const end = performance.now();
    const duration = (end - start);

    console.log(`⏱️ Selected ${results.length} records in ${duration.toFixed(2)} ms`);
  }
}