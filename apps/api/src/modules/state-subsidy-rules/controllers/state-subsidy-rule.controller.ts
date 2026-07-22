import type { Request, Response, NextFunction } from "express";
import type { StateSubsidyRuleService } from "../services/state-subsidy-rule.service.js";
import type { IAuthenticatedRequest } from "../../auth/interfaces/auth.interface.js";
import { STATE_SUBSIDY_RULE_MESSAGES } from "../constants/state-subsidy-rule.constants.js";

export class StateSubsidyRuleController {
    private readonly service: StateSubsidyRuleService;

    constructor(service: StateSubsidyRuleService) {
        this.service = service;
    }

    public createRule = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const payload = {
                ...req.body,
                state_uid: req.body.stateUid !== undefined ? (req.body.stateUid === "All" ? null : req.body.stateUid) : undefined,
            };
            const rule = await this.service.createRule(payload, authReq.user.uid, authReq.tenantUid);
            res.status(201).json({
                success: true,
                message: STATE_SUBSIDY_RULE_MESSAGES.CREATED,
                data: rule,
            });
        } catch (error) {
            next(error);
        }
    };

    public updateRule = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const uid = req.params.uid as string;
            const authReq = req as IAuthenticatedRequest;
            const payload = {
                ...req.body,
                state_uid: req.body.stateUid !== undefined ? (req.body.stateUid === "All" ? null : req.body.stateUid) : undefined,
            };
            const rule = await this.service.updateRule(uid, payload, authReq.user.uid, authReq.tenantUid);
            res.status(200).json({
                success: true,
                message: STATE_SUBSIDY_RULE_MESSAGES.UPDATED,
                data: rule,
            });
        } catch (error) {
            next(error);
        }
    };

    public getRuleByUid = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const uid = req.params.uid as string;
            const rule = await this.service.getRuleByUid(uid);
            res.status(200).json({
                success: true,
                message: STATE_SUBSIDY_RULE_MESSAGES.FETCHED,
                data: rule,
            });
        } catch (error) {
            next(error);
        }
    };

    public getRulesByStateUid = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const stateUid = req.params.stateUid as string;
            const rules = await this.service.getRulesByStateUid(stateUid);
            res.status(200).json({
                success: true,
                message: STATE_SUBSIDY_RULE_MESSAGES.FETCHED,
                data: rules,
            });
        } catch (error) {
            next(error);
        }
    };

    public getCombinedRequiredDocuments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const subsidyUids = (req.body.subsidyUids || []) as string[];
            const docs = await this.service.getCombinedRequiredDocuments(subsidyUids);
            res.status(200).json({
                success: true,
                message: STATE_SUBSIDY_RULE_MESSAGES.FETCHED,
                data: docs,
            });
        } catch (error) {
            next(error);
        }
    };

    public getPaginatedRules = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const result = await this.service.getPaginatedRules(req.body);
            res.status(200).json({
                success: true,
                message: STATE_SUBSIDY_RULE_MESSAGES.FETCHED,
                data: result.data,
                meta: {
                    total: result.total,
                    page: req.body.page,
                    limit: req.body.limit,
                    totalPages: result.totalPages,
                },
            });
        } catch (error) {
            next(error);
        }
    };

    public getDropdownRules = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const rules = await this.service.getDropdownRules();
            res.status(200).json({
                success: true,
                message: STATE_SUBSIDY_RULE_MESSAGES.FETCHED,
                data: rules,
            });
        } catch (error) {
            next(error);
        }
    };

    public deleteRule = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const uid = req.params.uid as string;
            const authReq = req as IAuthenticatedRequest;
            await this.service.softDeleteRule(uid, authReq.user.uid, authReq.tenantUid);
            res.status(200).json({
                success: true,
                message: STATE_SUBSIDY_RULE_MESSAGES.DELETED,
                data: null,
            });
        } catch (error) {
            next(error);
        }
    };

    public restoreRule = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const uid = req.params.uid as string;
            const authReq = req as IAuthenticatedRequest;
            await this.service.restoreRule(uid, authReq.user.uid, authReq.tenantUid);
            res.status(200).json({
                success: true,
                message: STATE_SUBSIDY_RULE_MESSAGES.RESTORED,
                data: null,
            });
        } catch (error) {
            next(error);
        }
    };
}
