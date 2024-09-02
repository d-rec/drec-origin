import { Test, TestingModule } from '@nestjs/testing';
import { CountrycodeService } from './countrycode.service';
import { FilterKeyDTO } from './dto';
import { countryCodesList } from '../../models/country-code';

describe('CountrycodeService', () => {
  let service: CountrycodeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CountrycodeService],
    }).compile();

    service = module.get<CountrycodeService>(CountrycodeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getCountryCode', () => {
    it('should return all countries when no search keyword is provided', async () => {
      const filterDto: FilterKeyDTO = { searchKeyWord: '' };
      const result = await service.getCountryCode(filterDto);
      expect(result).toEqual(countryCodesList);
    });
  
    it('should filter countries based on a search keyword matching the country name', async () => {
      const filterDto: FilterKeyDTO = { searchKeyWord: 'India' };
      const result = await service.getCountryCode(filterDto);
      expect(result).toEqual(
        countryCodesList.filter((ele) => ele.country.match(/India/i)),
      );
    });
  
    it('should return an empty array if no matches are found for the search keyword', async () => {
      const filterDto: FilterKeyDTO = { searchKeyWord: 'NonExistingCountry' };
      const result = await service.getCountryCode(filterDto);
      expect(result).toEqual([]);
    });
  
    it('should handle empty string as a search keyword and return all countries', async () => {
      const filterDto: FilterKeyDTO = { searchKeyWord: '' };
      const result = await service.getCountryCode(filterDto);
      expect(result).toEqual(countryCodesList);
    });
  });
});
