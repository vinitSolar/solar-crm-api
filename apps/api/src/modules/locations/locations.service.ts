import { locationsRepository } from './locations.repository.js';
import type { State, District, City } from './locations.types.js';
import postalcodes from 'postalcodes-india';

export class LocationsService {
    public async getStates(): Promise<State[]> {
        return locationsRepository.getStates();
    }

    public async getDistrictsByState(stateUid: string): Promise<District[]> {
        return locationsRepository.getDistrictsByState(stateUid);
    }


    public async getCitiesByState(stateUid: string): Promise<City[]> {
        return locationsRepository.getCitiesByState(stateUid);
    }

    public async getCitiesByDistrict(districtUid: string): Promise<City[]> {
        return locationsRepository.getCitiesByDistrict(districtUid);
    }

    public async getLocationByPincode(pincode: number): Promise<any> {
        const result = postalcodes.find(pincode.toString());
        if (!result || !result.isValid) return null;
        return {
            city_name: result.place,
            locality_name: result.place,
            district_name: result.district,
            state_name: result.state,
        };
    }

    public async getLocalitiesByPincode(pincode: number): Promise<any[]> {
        const result = postalcodes.find(pincode.toString());
        if (!result || !result.isValid) return [];
        return [{
            locality_name: result.place,
            city_name: result.place,
            district_name: result.district,
            state_name: result.state,
        }];
    }
}

export const locationsService = new LocationsService();
