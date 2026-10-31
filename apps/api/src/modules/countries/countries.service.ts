import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CountriesService {
  constructor(private readonly prisma: PrismaService) {}

  async getActiveCountries() {
    return this.prisma.country.findMany({
      where: { is_active: true },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        code: true,
        name: true,
        iso3: true,
        dial_code: true,
      },
    });
  }
}
