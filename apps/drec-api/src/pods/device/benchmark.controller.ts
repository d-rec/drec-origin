import { Controller, Get } from '@nestjs/common';
import { BenchmarkService } from './benchmark.service';

@Controller('benchmark')
export class BenchmarkController {
  constructor(private readonly benchmarkService: BenchmarkService) {}

  @Get()
  async runBenchmark(): Promise<string> {
    await this.benchmarkService.benchmarkSelect(1000);
    await this.benchmarkService.benchmarkSelect(5000);
    await this.benchmarkService.benchmarkSelect(10000);
    await this.benchmarkService.benchmarkSelect(50000);
    await this.benchmarkService.benchmarkSelect(100000);
    await this.benchmarkService.benchmarkSelect(500000);
    return 'Benchmark complete. Check console for results.';
  }
}