import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../pods/user/user.entity';
import { TestingController } from '../testing/testing.controller';
import { TestingService } from '../testing/testing.service';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [TestingController],
  providers: [TestingService],
})
export class TestingModule {}
