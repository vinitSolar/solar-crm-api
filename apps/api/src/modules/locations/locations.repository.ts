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

    public async getLocationByPincode(pincode: number): Promise<any> {
        const query = `
            SELECT 
                c.uid as city_uid, c.name as city_name, c.branch_type, c.block,
                d.uid as district_uid, d.name as district_name,
                s.uid as state_uid, s.name as state_name
            FROM cities c
            LEFT JOIN districts d ON c.district_uid = d.uid
            LEFT JOIN states s ON c.state_uid = s.uid
            WHERE c.pincode = $1
            ORDER BY 
                CASE WHEN c.branch_type = 'Head Post Office' THEN 1 
                     WHEN c.branch_type = 'Sub Post Office' THEN 2 
                     ELSE 3 
                END ASC
            LIMIT 1;
        `;
        const result = await pool.query(query, [pincode]);
        return result.rows[0] || null;
    }

    public async getLocalitiesByPincode(pincode: number): Promise<any[]> {
        const query = `
            SELECT 
                c.uid as city_uid, c.name as locality_name, c.branch_type, c.block,
                d.uid as district_uid, d.name as district_name,
                s.uid as state_uid, s.name as state_name
            FROM cities c
            LEFT JOIN districts d ON c.district_uid = d.uid
            LEFT JOIN states s ON c.state_uid = s.uid
            WHERE c.pincode = $1
            ORDER BY c.name ASC;
        `;
        const result = await pool.query(query, [pincode]);
        return result.rows;
    }
}

export const locationsRepository = new LocationsRepository();
