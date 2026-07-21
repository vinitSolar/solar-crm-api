import { Router } from 'express';
import { locationsController } from './locations.controller.js';
import { authenticate } from '../auth/middleware/auth.middleware.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Locations
 *   description: Location management API
 */

// Applying authentication middleware for all location routes
router.use(authenticate);

/**
 * @swagger
 * /api/v1/locations/states:
 *   get:
 *     summary: Get all states
 *     tags: [Locations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved all states
 */
router.get('/states', locationsController.getStates);

/**
 * @swagger
 * /api/v1/locations/states/{uid}/districts:
 *   get:
 *     summary: Get districts by state ID
 *     tags: [Locations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successfully retrieved districts
 */
router.get('/states/:uid/districts', locationsController.getDistrictsByState);

/**
 * @swagger
 * /api/v1/locations/states/{uid}/cities:
 *   get:
 *     summary: Get cities by state ID
 *     tags: [Locations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successfully retrieved cities
 */
router.get('/states/:uid/cities', locationsController.getCitiesByState);

/**
 * @swagger
 * /api/v1/locations/districts/{uid}/cities:
 *   get:
 *     summary: Get cities by district ID
 *     tags: [Locations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uid
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successfully retrieved cities
 *       400:
 *         description: Invalid district uid
 */
router.get('/districts/:uid/cities', locationsController.getCitiesByDistrict);

/**
 * @swagger
 * /api/v1/locations/pincode/{pincode}/localities:
 *   get:
 *     summary: Get all localities (cities) by pincode
 *     tags: [Locations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: pincode
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Successfully retrieved localities
 *       404:
 *         description: No localities found
 */
router.get('/pincode/:pincode/localities', locationsController.getLocalitiesByPincode);

/**
 * @swagger
 * /api/v1/locations/pincode/{pincode}:
 *   get:
 *     summary: Get location (city, district, state) by pincode
 *     tags: [Locations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: pincode
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Successfully retrieved location
 *       404:
 *         description: Location not found
 */
router.get('/pincode/:pincode', locationsController.getLocationByPincode);

export default router;
