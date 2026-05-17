import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IdempotencyKeyEntity } from './idempotency-key.entity';
import { IdempotencyInterceptor } from './idempotency.interceptor';
import { IdempotencyCleanupService } from './idempotency-cleanup.service';

@Module({
  imports: [TypeOrmModule.forFeature([IdempotencyKeyEntity])],
  providers: [IdempotencyInterceptor, IdempotencyCleanupService],
  exports: [IdempotencyInterceptor],
})
export class IdempotencyModule {}
