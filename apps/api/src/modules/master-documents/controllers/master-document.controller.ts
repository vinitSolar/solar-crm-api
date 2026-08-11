import type { Request, Response, NextFunction } from "express";
import type { MasterDocumentService } from "../services/master-document.service.js";
import { MASTER_DOCUMENT_MESSAGES } from "../constants/master-documents.constants.js";
import type { IAuthenticatedRequest } from "../../auth/interfaces/auth.interface.js";
import type {
  ModuleType,
  EntityType,
} from "../interfaces/master-documents.interface.js";

export class MasterDocumentController {
  private readonly service: MasterDocumentService;

  constructor(service: MasterDocumentService) {
    this.service = service;
  }

  uploadDocument = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const authReq = req as IAuthenticatedRequest;
      const tenantUid = authReq.tenantUid;
      const createdBy = authReq.user.uid;

      const file = req.file as Express.Multer.File;

      // req.body includes: documentTypeUid, entityType, entityUid, module, contextUid, documentNumber, remarks
      const doc = await this.service.uploadAndAssociate(
        tenantUid,
        req.body,
        file,
        createdBy,
      );

      res.status(201).json({
        success: true,
        message: MASTER_DOCUMENT_MESSAGES.UPLOADED,
        data: doc,
      });
    } catch (error) {
      next(error);
    }
  };

  linkDocument = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const authReq = req as IAuthenticatedRequest;
      const tenantUid = authReq.tenantUid;
      const createdBy = authReq.user.uid;

      // req.body includes: masterDocumentUid, module, contextUid, remarks
      const doc = await this.service.linkExisting(
        tenantUid,
        req.body,
        createdBy,
      );

      res.status(200).json({
        success: true,
        message: MASTER_DOCUMENT_MESSAGES.LINKED,
        data: doc,
      });
    } catch (error) {
      next(error);
    }
  };

  getDocumentsByContext = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const authReq = req as IAuthenticatedRequest;
      const tenantUid = authReq.tenantUid;
      const module = req.params.module as ModuleType;
      const contextUid = req.params.contextUid as string;

      const docs = await this.service.getByContextGrouped(
        tenantUid,
        module,
        contextUid,
      );

      res.status(200).json({
        success: true,
        message: MASTER_DOCUMENT_MESSAGES.FETCHED,
        data: docs,
      });
    } catch (error) {
      next(error);
    }
  };

  getAvailableDocuments = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const authReq = req as IAuthenticatedRequest;
      const tenantUid = authReq.tenantUid;
      const module = req.params.module as ModuleType;
      const contextUid = req.params.contextUid as string;

      const entityType = req.query.entityType as EntityType;
      const entityUid = req.query.entityUid as string;

      const docs = await this.service.getAvailableToLink(
        tenantUid,
        entityType,
        entityUid,
        module,
        contextUid,
      );

      res.status(200).json({
        success: true,
        message: MASTER_DOCUMENT_MESSAGES.FETCHED,
        data: docs,
      });
    } catch (error) {
      next(error);
    }
  };

  unlinkDocument = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const authReq = req as IAuthenticatedRequest;
      const tenantUid = authReq.tenantUid;
      const deletedBy = authReq.user.uid;
      const associationUid = req.params.uid as string;

      await this.service.unlinkDocument(tenantUid, associationUid, deletedBy);

      res.status(200).json({
        success: true,
        message: MASTER_DOCUMENT_MESSAGES.UNLINKED,
        data: null,
      });
    } catch (error) {
      next(error);
    }
  };

  deleteMasterDocument = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const authReq = req as IAuthenticatedRequest;
      const tenantUid = authReq.tenantUid;
      const deletedBy = authReq.user.uid;
      const masterDocumentUid = req.params.uid as string;

      await this.service.deleteMasterDocument(
        tenantUid,
        masterDocumentUid,
        deletedBy,
      );

      res.status(200).json({
        success: true,
        message: MASTER_DOCUMENT_MESSAGES.DELETED,
        data: null,
      });
    } catch (error) {
      next(error);
    }
  };
}
