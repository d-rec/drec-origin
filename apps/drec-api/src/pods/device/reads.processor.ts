import { Process, Processor } from "@nestjs/bull";
import { ReadsService } from "../reads/reads.service";
import { Job } from "bull";

@Processor('reads-queue')
export class ReadsProcessor {
  constructor(private readsService: ReadsService) {}

  @Process('process-meter-reads')
  async handleMeterReadsProcessing(job: Job) {
    const { fileId, userId} = job.data;
    await this.readsService.processMeterReadsFile(fileId, userId);
  }
}
