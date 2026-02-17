import { BadRequestException, Injectable } from '@nestjs/common';
import { getCities, getStatesByShort } from 'countrycitystatejson';

@Injectable()
export class LocationService {
  async getStatesByCountryCode(countryCode: string) {
    try {

      if (!countryCode || countryCode.length !== 2) {
        throw new BadRequestException('Invalid country code');
      }

      const code = countryCode.toUpperCase();
      const states = getStatesByShort(code);

      if (!states || !states.length) {
        return [];
      }
      return states;
    } catch (error) {
      throw error
    }
  }

  async getCitiesByState(countryCode: string, stateName: string) {
    try {
      if (!countryCode || countryCode.length !== 2) {
        throw new BadRequestException('Invalid country code');
      }

      if (!stateName) {
        throw new BadRequestException('Invalid state name');
      }

      const code = countryCode.toUpperCase();

      const cities = getCities(code, stateName);

      if (!cities || !cities.length) {
        return [];
      }
      return cities;
    } catch (error) {
      console.log("error", error);
      throw error
    }
  }
}
