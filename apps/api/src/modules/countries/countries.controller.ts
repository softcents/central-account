import { Controller, Get } from '@nestjs/common';
import { CountriesService } from './countries.service';
import { Public } from '../../common/decorators/public.decorator';

@Controller('countries')
export class CountriesController {
  constructor(private readonly countriesService: CountriesService) {}

  @Public()
  @Get()
  async getCountries() {
    return this.countriesService.getActiveCountries();
  }
}
