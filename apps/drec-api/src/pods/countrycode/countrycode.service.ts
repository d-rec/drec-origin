import { Injectable } from '@nestjs/common';
import { CountryCodeNameDTO, FilterKeyDTO } from './dto'
import { countrCodesList } from '../../models/country-code'
@Injectable()
export class CountrycodeService {

    //@InjectRepository(Device) private readonly repository: Repository<Device>,
    public async  getCountryCode(filterDto: FilterKeyDTO): Promise<CountryCodeNameDTO[]> {
        let countries = countrCodesList;
        if (filterDto.searchKeyWord && filterDto.searchKeyWord.length > 0) {
            const regex = new RegExp(`${filterDto.searchKeyWord}`, 'i')
            return countries.filter(ele => regex.test(ele.country) || regex.test(ele.countryCode))
        }
        else {
            return countries;
        }
    }
}
