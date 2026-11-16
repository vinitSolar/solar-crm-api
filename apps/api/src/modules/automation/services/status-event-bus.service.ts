import { EventEmitter } from "events";
import { logger } from "@packages/logger/index.js";
import { STATUS_EVENTS, type StatusEventType } from "../constants/status-events.constants.js";

export interface IStatusEventPayload {
    tenantUid: string;
    actorUid: string;
    entityType: "lead" | "project" | "survey" | "quotation" | "milestone" | "payment";
    entityUid: string;
    metadata?: Record<string, any>;
}

class StatusEventBus extends EventEmitter {
    constructor() {
        super();
        this.setMaxListeners(30);
    }

    emitEvent(eventType: StatusEventType, payload: IStatusEventPayload): boolean {
        logger.info(`[StatusEventBus] Emitting event: ${eventType}`, {
            tenantUid: payload.tenantUid,
            entityType: payload.entityType,
            entityUid: payload.entityUid,
        });
        return this.emit(eventType, payload);
    }
}

export const statusEventBus = new StatusEventBus();

