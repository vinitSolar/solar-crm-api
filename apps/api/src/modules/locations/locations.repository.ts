import pool from '@packages/connection.js';
import type { State, District, City } from './locations.types.js';

export class LocationsRepository {
    public async getStates(): Promise<State[]> {
        const query = `
            SELECT * FROM states
            ORDER BY name ASC;
        `;
        const result = await pool.query(query);
        return result.rows;
    }

    public async getDistrictsByState(stateUid: string): Promise<District[]> {
        const query = `
            SELECT * FROM districts
            WHERE state_uid = $1
            ORDER BY name ASC;
        `;
        const result = await pool.query(query, [stateUid]);
        return result.rows;
    }


    public async getCitiesByState(stateUid: string): Promise<City[]> {
        const query = `
            SELECT * FROM cities
            WHERE state_uid = $1
            ORDER BY name ASC;
        `;
        const result = await pool.query(query, [stateUid]);
        return result.rows;
    }

    public async getCitiesByDistrict(districtUid: string): Promise<City[]> {
        const query = `
            SELECT * FROM cities
            WHERE district_uid = $1
            ORDER BY name ASC;
        `;
        const result = await pool.query(query, [districtUid]);
        return result.rows;
    }
}

export const locationsRepository = new LocationsRepository();
