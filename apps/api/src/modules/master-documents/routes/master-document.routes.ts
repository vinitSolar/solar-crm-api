import { Router } from "express";
import { MasterDocumentController } from "../controllers/master-document.controller.js";
import { MasterDocumentService } from "../services/master-document.service.js";
import { MasterDocumentRepository } from "../repositories/master-document.repository.js";
import { DocumentAssociationRepository } from "../repositories/document-association.repository.js";
import { MasterDocumentTypeRepository } from "../repositories/master-document-type.repository.js";
import {
  uploadDocumentSchema,
  linkDocumentSchema,
  getByContextSchema,
  getAvailableSchema,
  uidParamSchema,
  validateMasterDocumentRequest,
} from "../validators/master-documents.validator.js";
import { authenticate } from "../../auth/middleware/auth.middleware.js";
import pool from "@packages/connection.js";
import multer from "multer";

function createMasterDocumentRouter(): Router {
  const router = Router();

  const documentRepository = new MasterDocumentRepository(pool);
  const associationRepository = new DocumentAssociationRepository(pool);
  const typeRepository = new MasterDocumentTypeRepository(pool);

  const service = new MasterDocumentService(
    documentRepository,
    associationRepository,
    typeRepository,
    pool,
  );
  const controller = new MasterDocumentController(service);

  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit
    },
  });

  router.use(authenticate);

  /**
   * @swagger
   * /documents/upload:
   *   post:
   *     tags: [Master Documents]
   *     summary: Upload a new physical document and associate it
   *     security:
   *       - bearerAuth: []
   */
  router.post(
    "/upload",
    upload.single("file"),
    validateMasterDocumentRequest(uploadDocumentSchema),
    controller.uploadDocument,
  );

  /**
   * @swagger
   * /documents/link:
   *   post:
   *     tags: [Master Documents]
   *     summary: Link an existing master document to a new context (no re-upload)
   *     security:
   *       - bearerAuth: []
   */
  router.post(
    "/link",
    validateMasterDocumentRequest(linkDocumentSchema),
    controller.linkDocument,
  );

  /**
   * @swagger
   * /documents/context/{module}/{contextUid}:
   *   get:
   *     tags: [Master Documents]
   *     summary: Get all documents linked to a specific module context
   *     security:
   *       - bearerAuth: []
   */
  router.get(
    "/context/:module/:contextUid",
    validateMasterDocumentRequest(getByContextSchema),
    controller.getDocumentsByContext,
  );

  /**
   * @swagger
   * /documents/available/{module}/{contextUid}:
   *   get:
   *     tags: [Master Documents]
   *     summary: Get all documents for an entity that are NOT YET linked to this context
   *     security:
   *       - bearerAuth: []
   */
  router.get(
    "/available/:module/:contextUid",
    validateMasterDocumentRequest(getAvailableSchema),
    controller.getAvailableDocuments,
  );

  /**
   * @swagger
   * /documents/association/{uid}:
   *   delete:
   *     tags: [Master Documents]
   *     summary: Unlink a document from a context (does not delete the physical file)
   *     security:
   *       - bearerAuth: []
   */
  router.delete(
    "/association/:uid",
    validateMasterDocumentRequest(uidParamSchema),
    controller.unlinkDocument,
  );

  /**
   * @swagger
   * /documents/{uid}:
   *   delete:
   *     tags: [Master Documents]
   *     summary: Delete a master document and all its associations
   *     security:
   *       - bearerAuth: []
   */
  router.delete(
    "/:uid",
    validateMasterDocumentRequest(uidParamSchema),
    controller.deleteMasterDocument,
  );

  return router;
}

export const masterDocumentRoutes = createMasterDocumentRouter();
