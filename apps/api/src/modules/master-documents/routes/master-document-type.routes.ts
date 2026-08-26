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
import { requirePermission } from "../../../middlewares/permission.middleware.js";

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
    requirePermission("DOCUMENT_TYPES", "can_view"),
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
  router.get("/all", requirePermission("DOCUMENT_TYPES", "can_view"), controller.getAllDocumentTypes);

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
    requirePermission("DOCUMENT_TYPES", "can_view"),
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
    requirePermission("DOCUMENT_TYPES", "can_view"),
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
    requirePermission("DOCUMENT_TYPES", "can_view"),
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
    requirePermission("DOCUMENT_TYPES", "can_create"),
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
    requirePermission("DOCUMENT_TYPES", "can_edit"),
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
    requirePermission("DOCUMENT_TYPES", "can_delete"),
    validateMasterDocumentRequest(uidParamSchema),
    controller.deleteDocumentType,
  );

  return router;
}

export const masterDocumentTypeRoutes = createMasterDocumentTypeRouter();
