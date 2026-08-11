import type { Request, Response, NextFunction } from "express";
import type { MasterDocumentTypeService } from "../services/master-document-type.service.js";
import { MASTER_DOCUMENT_TYPE_MESSAGES } from "../constants/master-documents.constants.js";
import type { IAuthenticatedRequest } from "../../auth/interfaces/auth.interface.js";

export class MasterDocumentTypeController {
  private readonly service: MasterDocumentTypeService;

  constructor(service: MasterDocumentTypeService) {
    this.service = service;
  }

  createDocumentType = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const authReq = req as IAuthenticatedRequest;
      const tenantUid = authReq.tenantUid; // Assuming this is set by auth middleware
      const createdBy = authReq.user.uid;

      const docType = await this.service.create(tenantUid, req.body, createdBy);

      res.status(201).json({
        success: true,
        message: MASTER_DOCUMENT_TYPE_MESSAGES.CREATED,
        data: docType,
      });
    } catch (error) {
      next(error);
    }
  };

  getDocumentTypeByUid = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const authReq = req as IAuthenticatedRequest;
      const tenantUid = authReq.tenantUid;
      const uid = req.params.uid as string;

      const docType = await this.service.getByUid(uid, tenantUid);

      res.status(200).json({
        success: true,
        message: MASTER_DOCUMENT_TYPE_MESSAGES.FETCHED,
        data: docType,
      });
    } catch (error) {
      next(error);
    }
  };

  getAllDocumentTypes = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const authReq = req as IAuthenticatedRequest;
      const tenantUid = authReq.tenantUid;
      const status = req.query.status as string;

      const docTypes = await this.service.getAll(tenantUid, status);

      res.status(200).json({
        success: true,
        message: MASTER_DOCUMENT_TYPE_MESSAGES.FETCHED_ALL,
        data: docTypes,
      });
    } catch (error) {
      next(error);
    }
  };

  getPaginatedDocumentTypes = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const authReq = req as IAuthenticatedRequest;
      const tenantUid = authReq.tenantUid;
      const query = req.body;

      const result = await this.service.getPaginated(tenantUid, query);

      res.status(200).json({
        success: true,
        message: MASTER_DOCUMENT_TYPE_MESSAGES.FETCHED_ALL,
        data: result.data,
        meta: result.meta,
      });
    } catch (error) {
      next(error);
    }
  };

  getDocumentTypesByModule = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const authReq = req as IAuthenticatedRequest;
      const tenantUid = authReq.tenantUid;
      const module = req.params.module as string;

      const docTypes = await this.service.getByModule(module, tenantUid);

      res.status(200).json({
        success: true,
        message: MASTER_DOCUMENT_TYPE_MESSAGES.FETCHED_ALL,
        data: docTypes,
      });
    } catch (error) {
      next(error);
    }
  };

  getDocumentTypesWithUploads = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const authReq = req as IAuthenticatedRequest;
      const tenantUid = authReq.tenantUid;
      const module = req.params.module as import("../interfaces/master-documents.interface.js").ModuleType;
      const contextUid = req.params.contextUid as string;

      const docTypes = await this.service.getByModuleWithUploads(
        module,
        contextUid,
        tenantUid,
      );

      res.status(200).json({
        success: true,
        message: MASTER_DOCUMENT_TYPE_MESSAGES.FETCHED_ALL,
        data: docTypes,
      });
    } catch (error) {
      next(error);
    }
  };

  updateDocumentType = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const authReq = req as IAuthenticatedRequest;
      const tenantUid = authReq.tenantUid;
      const updatedBy = authReq.user.uid;
      const uid = req.params.uid as string;

      const docType = await this.service.update(
        uid,
        req.body,
        updatedBy,
        tenantUid,
      );

      res.status(200).json({
        success: true,
        message: MASTER_DOCUMENT_TYPE_MESSAGES.UPDATED,
        data: docType,
      });
    } catch (error) {
      next(error);
    }
  };

  deleteDocumentType = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const authReq = req as IAuthenticatedRequest;
      const tenantUid = authReq.tenantUid;
      const deletedBy = authReq.user.uid;
      const uid = req.params.uid as string;

      await this.service.delete(uid, deletedBy, tenantUid);

      res.status(200).json({
        success: true,
        message: MASTER_DOCUMENT_TYPE_MESSAGES.DELETED,
        data: null,
      });
    } catch (error) {
      next(error);
    }
  };
}
