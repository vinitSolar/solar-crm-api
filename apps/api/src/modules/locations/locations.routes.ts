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
 * /api/v1/locations/districts/{uid}/subdistricts:
 *   get:
 *     summary: Get subdistricts by district ID
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
 *         description: Successfully retrieved subdistricts
 */
router.get('/districts/:uid/subdistricts', locationsController.getSubdistrictsByDistrict);

/**
 * @swagger
 * /api/v1/locations/subdistricts/{uid}/villages:
 *   get:
 *     summary: Get villages by subdistrict ID
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
 *         description: Successfully retrieved villages
 */
router.get('/subdistricts/:uid/villages', locationsController.getVillagesBySubdistrict);

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

export default router;
