import type { Request, Response } from 'express';
import { locationsService } from './locations.service.js';
import { asyncHandler } from '../../utils/async-handler.js';

export class LocationsController {
    public getStates = asyncHandler(async (req: Request, res: Response) => {
        const states = await locationsService.getStates();
        return res.status(200).json({ success: true, message: 'States retrieved successfully', data: states });
    });

    public getDistrictsByState = asyncHandler(async (req: Request, res: Response) => {
        const stateUid = req.params.uid as string;
        if (!stateUid) {
            return res.status(400).json({ success: false, message: 'Invalid state uid' });
        }
        const districts = await locationsService.getDistrictsByState(stateUid);
        return res.status(200).json({ success: true, message: 'Districts retrieved successfully', data: districts });
    });

    public getSubdistrictsByDistrict = asyncHandler(async (req: Request, res: Response) => {
        const districtUid = req.params.uid as string;
        if (!districtUid) {
            return res.status(400).json({ success: false, message: 'Invalid district uid' });
        }
        const subdistricts = await locationsService.getSubdistrictsByDistrict(districtUid);
        return res.status(200).json({ success: true, message: 'Subdistricts retrieved successfully', data: subdistricts });
    });

    public getVillagesBySubdistrict = asyncHandler(async (req: Request, res: Response) => {
        const subdistrictUid = req.params.uid as string;
        if (!subdistrictUid) {
            return res.status(400).json({ success: false, message: 'Invalid subdistrict uid' });
        }
        const villages = await locationsService.getVillagesBySubdistrict(subdistrictUid);
        return res.status(200).json({ success: true, message: 'Villages retrieved successfully', data: villages });
    });

    public getCitiesByState = asyncHandler(async (req: Request, res: Response) => {
        const stateUid = req.params.uid as string;
        if (!stateUid) {
            return res.status(400).json({ success: false, message: 'Invalid state uid' });
        }
        const cities = await locationsService.getCitiesByState(stateUid);
        return res.status(200).json({ success: true, message: 'Cities retrieved successfully', data: cities });
    });
}

export const locationsController = new LocationsController();
