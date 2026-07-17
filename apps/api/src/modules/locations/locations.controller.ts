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


    public getCitiesByState = asyncHandler(async (req: Request, res: Response) => {
        const stateUid = req.params.uid as string;
        if (!stateUid) {
            return res.status(400).json({ success: false, message: 'Invalid state uid' });
        }
        const cities = await locationsService.getCitiesByState(stateUid);
        return res.status(200).json({ success: true, message: 'Cities retrieved successfully', data: cities });
    });

    public getCitiesByDistrict = asyncHandler(async (req: Request, res: Response) => {
        const districtUid = req.params.uid as string;
        if (!districtUid) {
            return res.status(400).json({ success: false, message: 'Invalid district uid' });
        }
        const cities = await locationsService.getCitiesByDistrict(districtUid);
        return res.status(200).json({ success: true, message: 'Cities retrieved successfully', data: cities });
    });
}

export const locationsController = new LocationsController();
