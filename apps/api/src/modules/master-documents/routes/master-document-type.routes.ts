import { Router } from "express";
import { MasterDocumentTypeController } from "../controllers/master-document-type.controller.js";
import { MasterDocumentTypeService } from "../services/master-document-type.service.js";
import { MasterDocumentTypeRepository } from "../repositories/master-document-type.repository.js";
import { DocumentAssociationRepository } from "../repositories/document-association.repository.js";
import { MasterDocumentRepository } from "../repositories/master-document.repository.js";
import {
  createDocumentTypeSchema,
  updateDocumentTypeSchema,
  uidParamSchema,
  moduleParamSchema,
  getByModuleAndContextSchema,
  paginationSchema,
  validateMasterDocumentRequest,
} from "../validators/master-documents.validator.js";
import { authenticate } from "../../auth/middleware/auth.middleware.js";
import pool from "@packages/connection.js";

function createMasterDocumentTypeRouter(): Router {
  const router = Router();

  const repository = new MasterDocumentTypeRepository(pool);
  const associationRepository = new DocumentAssociationRepository(pool);
  const documentRepository = new MasterDocumentRepository(pool);
  const service = new MasterDocumentTypeService(
    repository,
    associationRepository,
    documentRepository
  );
  const controller = new MasterDocumentTypeController(service);

  router.use(authenticate);

  /**
   * @swagger
   * /document-types/list:
   *   post:
   *     tags: [Master Document Types]
   *     summary: Get paginated master document types
   *     security:
   *       - bearerAuth: []
   */
  router.post(
    "/list",
    validateMasterDocumentRequest(paginationSchema),
    controller.getPaginatedDocumentTypes,
  );

  /**
   * @swagger
   * /document-types/all:
   *   get:
   *     tags: [Master Document Types]
   *     summary: Get all master document types (unpaginated)
   *     security:
   *       - bearerAuth: []
   */
  router.get("/all", controller.getAllDocumentTypes);

  /**
   * @swagger
   * /document-types/module/{module}:
   *   get:
   *     tags: [Master Document Types]
   *     summary: Get master document types by applicable module
   *     security:
   *       - bearerAuth: []
   */
  router.get(
    "/module/:module",
    validateMasterDocumentRequest(moduleParamSchema),
    controller.getDocumentTypesByModule,
  );

  /**
   * @swagger
   * /document-types/module/{module}/context/{contextUid}:
   *   get:
   *     tags: [Master Document Types]
   *     summary: Get master document types by module along with their uploaded files for a specific context
   *     security:
   *       - bearerAuth: []
   */
  router.get(
    "/module/:module/context/:contextUid",
    validateMasterDocumentRequest(getByModuleAndContextSchema),
    controller.getDocumentTypesWithUploads,
  );

  /**
   * @swagger
   * /document-types/{uid}:
   *   get:
   *     tags: [Master Document Types]
   *     summary: Get master document type by UID
   *     security:
   *       - bearerAuth: []
   */
  router.get(
    "/:uid",
    validateMasterDocumentRequest(uidParamSchema),
    controller.getDocumentTypeByUid,
  );

  /**
   * @swagger
   * /document-types:
   *   post:
   *     tags: [Master Document Types]
   *     summary: Create a master document type
   *     security:
   *       - bearerAuth: []
   */
  router.post(
    "/",
    validateMasterDocumentRequest(createDocumentTypeSchema),
    controller.createDocumentType,
  );

  /**
   * @swagger
   * /document-types/{uid}:
   *   put:
   *     tags: [Master Document Types]
   *     summary: Update a master document type
   *     security:
   *       - bearerAuth: []
   */
  router.put(
    "/:uid",
    validateMasterDocumentRequest(updateDocumentTypeSchema),
    controller.updateDocumentType,
  );

  /**
   * @swagger
   * /document-types/{uid}:
   *   delete:
   *     tags: [Master Document Types]
   *     summary: Delete a master document type (soft delete)
   *     security:
   *       - bearerAuth: []
   */
  router.delete(
    "/:uid",
    validateMasterDocumentRequest(uidParamSchema),
    controller.deleteDocumentType,
  );

  return router;
}

export const masterDocumentTypeRoutes = createMasterDocumentTypeRouter();
