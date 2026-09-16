import { locationsRepository } from './locations.repository.js';
import { getOrSetCache } from '@packages/redis/index.js';
import type { State, District, City } from './locations.types.js';

const ONE_DAY_SECONDS = 86400;
const ONE_WEEK_SECONDS = 604800;

export class LocationsService {
    public async getStates(): Promise<State[]> {
        return getOrSetCache('cache:locations:states', ONE_DAY_SECONDS, () => locationsRepository.getStates());
    }

    public async getDistrictsByState(stateUid: string): Promise<District[]> {
        return getOrSetCache(`cache:locations:districts:${stateUid}`, ONE_DAY_SECONDS, () => locationsRepository.getDistrictsByState(stateUid));
    }

    public async getCitiesByState(stateUid: string): Promise<City[]> {
        return getOrSetCache(`cache:locations:cities:state:${stateUid}`, ONE_DAY_SECONDS, () => locationsRepository.getCitiesByState(stateUid));
    }

    public async getCitiesByDistrict(districtUid: string): Promise<City[]> {
        return getOrSetCache(`cache:locations:cities:dist:${districtUid}`, ONE_DAY_SECONDS, () => locationsRepository.getCitiesByDistrict(districtUid));
    }

    public async getLocationByPincode(pincode: number): Promise<any> {
        return getOrSetCache(`cache:locations:pincode:${pincode}`, ONE_WEEK_SECONDS, () => locationsRepository.getLocationByPincode(pincode));
    }

    public async getLocalitiesByPincode(pincode: number): Promise<any[]> {
        return getOrSetCache(`cache:locations:localities:${pincode}`, ONE_WEEK_SECONDS, () => locationsRepository.getLocalitiesByPincode(pincode));
    }
}

export const locationsService = new LocationsService();

