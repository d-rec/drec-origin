import { Module } from '@nestjs/common';
import { CountryCodeController } from './countrycode.controller';
import { CountryCodeService } from './countrycode.service';
@Module({
  providers: [CountryCodeService],
  exports: [CountryCodeService],
  controllers: [CountryCodeController],
})
export class CountryCodeModule {}
