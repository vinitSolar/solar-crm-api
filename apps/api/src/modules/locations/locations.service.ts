import { locationsRepository } from './locations.repository.js';
import type { State, District, Subdistrict, Village, City } from './locations.types.js';

export class LocationsService {
    public async getStates(): Promise<State[]> {
        return locationsRepository.getStates();
    }

    public async getDistrictsByState(stateUid: string): Promise<District[]> {
        return locationsRepository.getDistrictsByState(stateUid);
    }

    public async getSubdistrictsByDistrict(districtUid: string): Promise<Subdistrict[]> {
        return locationsRepository.getSubdistrictsByDistrict(districtUid);
    }

    public async getVillagesBySubdistrict(subdistrictUid: string): Promise<Village[]> {
        return locationsRepository.getVillagesBySubdistrict(subdistrictUid);
    }

    public async getCitiesByState(stateUid: string): Promise<City[]> {
        return locationsRepository.getCitiesByState(stateUid);
    }
}

export const locationsService = new LocationsService();
