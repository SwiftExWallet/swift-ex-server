import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import * as maxmind from 'maxmind';
import restrictedCountries from './util/restrictedCountries.json';

interface IPResult {
  countryCode: string | null;
  countryName: string | null;
  isRestricted: boolean;
}

@Injectable()
export class GeoLiteIpService implements OnModuleInit {
  private lookup: any = null;
  private readonly logger = new Logger(GeoLiteIpService.name);
  private restrictedCountries: any = null;

  async onModuleInit() {
    await this.init();
  }

  private async init(): Promise<void> {
    try {
      this.restrictedCountries = restrictedCountries;
      this.lookup = await maxmind.open(process.env.COUNTRY_DB as string);
      this.logger.log('GeoLite Country DB loaded successfully');
    } catch (error) {
      this.logger.error('Failed to load GeoLite DB:', error);
    }
  }

  checkIp(ip: string): IPResult {
    if (!ip) {
      return { countryCode: null, countryName: null, isRestricted: true };
    }
    if (!this.lookup) {
      return { countryCode: null, countryName: null, isRestricted: false };
    }
    try {
      const result = this.lookup.get(ip);
      if (!result?.country?.iso_code) {
        return { countryCode: null, countryName: null, isRestricted: false };
      }

      const isRestricted = this.restrictedCountries.includes(result.country.iso_code);

      return { countryCode:result.country.iso_code, countryName:result.country.names?.en, isRestricted };
    } catch (error) {
      this.logger.warn(`IP lookup failed for ${ip}`);
      return { countryCode: null, countryName: null, isRestricted: true };
    }
  }

  isRestricted(ip: string): boolean {
    return this.checkIp(ip).isRestricted;
  }
}
