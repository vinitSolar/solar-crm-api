import { locationsRepository } from './locations.repository.js';
import type { State, District, City } from './locations.types.js';

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
}

export const locationsService = new LocationsService();
