import { Injectable, Logger } from '@nestjs/common';
import { CountryCodeNameDTO, FilterKeyDTO } from './dto';
import { countryCodesList } from '../../models/country-code';
@Injectable()
export class CountryCodeService {
  private readonly logger = new Logger(CountryCodeService.name);

  //@InjectRepository(Device) private readonly repository: Repository<Device>,
  public async getCountryCode(
    filterDTO: FilterKeyDTO,
  ): Promise<CountryCodeNameDTO[]> {
    this.logger.verbose(`With in getCountryCode`);
    const countries = countryCodesList;
    if (filterDTO.searchKeyWord && filterDTO.searchKeyWord.length > 0) {
      const escaped = filterDTO.searchKeyWord.replace(
        /[.*+?^${}()|[\]\\]/g,
        '\\$&',
      );
      const regex = new RegExp(escaped, 'i');
      return countries.filter(
        (ele) => regex.test(ele.country) || regex.test(ele.countryCode),
      );
    } else {
      return countries;
    }
  }
}
