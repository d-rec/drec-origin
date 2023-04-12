import { InjectQueue } from '@nestjs/bull';
import { Controller, Get } from '@nestjs/common';
import { Queue } from 'bull';

@Controller('audio')
export class AudioController {
  constructor(@InjectQueue('audio') private readonly audioQueue: Queue) {}

  @Get('transcode')
  async transcode() {
    
    await this.audioQueue.add('transcode', {
      file: 'audio.mp3',
    });
    console.log('123123')
  }
}
