import pool from '@packages/connection.js';
import type { State, District, Subdistrict, Village, City } from './locations.types.js';

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
            WHERE state_id = (SELECT id FROM states WHERE uid = $1)
            ORDER BY name ASC;
        `;
        const result = await pool.query(query, [stateUid]);
        return result.rows;
    }

    public async getSubdistrictsByDistrict(districtUid: string): Promise<Subdistrict[]> {
        const query = `
            SELECT * FROM subdistricts
            WHERE district_id = (SELECT id FROM districts WHERE uid = $1)
            ORDER BY name ASC;
        `;
        const result = await pool.query(query, [districtUid]);
        return result.rows;
    }

    public async getVillagesBySubdistrict(subdistrictUid: string): Promise<Village[]> {
        const query = `
            SELECT * FROM villages
            WHERE subdistrict_id = (SELECT id FROM subdistricts WHERE uid = $1)
            ORDER BY name ASC;
        `;
        const result = await pool.query(query, [subdistrictUid]);
        return result.rows;
    }

    public async getCitiesByState(stateUid: string): Promise<City[]> {
        const query = `
            SELECT * FROM cities
            WHERE state_id = (SELECT id FROM states WHERE uid = $1)
            ORDER BY name ASC;
        `;
        const result = await pool.query(query, [stateUid]);
        return result.rows;
    }
}

export const locationsRepository = new LocationsRepository();
