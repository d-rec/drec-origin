import { Injectable, Logger } from '@nestjs/common';
import { CountryCodeNameDTO, FilterKeyDTO } from './dto';
import { countryCodesList } from '../../models/country-code';
@Injectable()
export class CountryCodeService {
  private readonly logger = new Logger(CountryCodeService.name);

  //@InjectRepository(Device) private readonly repository: Repository<Device>,
  public async getCountryCode(
    filterDto: FilterKeyDTO,
  ): Promise<CountryCodeNameDTO[]> {
    this.logger.verbose(`With in getCountryCode`);
    const countries = countryCodesList;
    if (filterDto.searchKeyWord && filterDto.searchKeyWord.length > 0) {
      const regex = new RegExp(`${filterDto.searchKeyWord}`, 'i');
      return countries.filter(
        (ele) => regex.test(ele.country) || regex.test(ele.countryCode),
      );
    } else {
      return countries;
    }
  }
}
