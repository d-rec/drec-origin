import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ESignatureLog } from './e-signature-log.entity';
import { ESignatureService } from './e-signature.service';

@Module({
  imports: [TypeOrmModule.forFeature([ESignatureLog])],
  providers: [ESignatureService],
  exports: [ESignatureService],
})
export class ESignatureModule {}
