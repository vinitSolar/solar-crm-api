/**
 * WhatsApp Self-Service Module — Session Repository
 *
 * Repository for managing whatsapp_customer_sessions records.
 */

import { v4 as uuidv4 } from "uuid";
import type { Pool } from "pg";
import pool from "@packages/connection.js";
import type { IWhatsAppCustomerSession } from "../interfaces/whatsapp-self-service.interface.js";
import { WHATSAPP_CONVERSATION_STATE, WHATSAPP_SESSION_EXPIRY_HOURS, type WhatsAppConversationState } from "../constants/whatsapp-self-service.constants.js";

export class WhatsAppSessionRepository {
    private readonly db: Pool;

    constructor(db: Pool = pool) {
        this.db = db;
    }

    /**
     * Map database row to typed IWhatsAppCustomerSession
     */
    private mapRow(row: any): IWhatsAppCustomerSession {
        return {
            id: String(row.id),
            uid: row.uid,
            tenantUid: row.tenant_uid,
            phoneNumber: row.phone_number,
            leadUid: row.lead_uid,
            currentState: row.current_state as WhatsAppConversationState,
            metadata: typeof row.metadata === "string" ? JSON.parse(row.metadata) : (row.metadata || {}),
            lastInteractionAt: new Date(row.last_interaction_at),
            expiresAt: row.expires_at ? new Date(row.expires_at) : null,
            isActive: Number(row.is_active),
            isDeleted: Number(row.is_deleted),
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at),
        };
    }

    /**
     * Find active session by normalized phone number
     */
    async findByPhoneNumber(phoneNumber: string): Promise<IWhatsAppCustomerSession | null> {
        const query = `
            SELECT * FROM whatsapp_customer_sessions
            WHERE phone_number = $1 AND is_deleted = 0
            ORDER BY updated_at DESC
            LIMIT 1
        `;
        const result = await this.db.query(query, [phoneNumber]);
        if (result.rows.length === 0) return null;
        return this.mapRow(result.rows[0]);
    }

    /**
     * Create a new customer session
     */
    async createSession(data: {
        tenantUid: string;
        phoneNumber: string;
        leadUid?: string | null;
        currentState?: WhatsAppConversationState;
        metadata?: Record<string, unknown>;
        expiresAt?: Date | null;
    }): Promise<IWhatsAppCustomerSession> {
        const uid = uuidv4();
        const expiresAt = data.expiresAt || new Date(Date.now() + WHATSAPP_SESSION_EXPIRY_HOURS * 60 * 60 * 1000);
        const currentState = data.currentState || WHATSAPP_CONVERSATION_STATE.MAIN_MENU;
        const metadata = JSON.stringify(data.metadata || {});

        const query = `
            INSERT INTO whatsapp_customer_sessions (
                uid, tenant_uid, phone_number, lead_uid, current_state,
                metadata, last_interaction_at, expires_at, is_active, is_deleted
            )
            VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, $7, 1, 0)
            RETURNING *
        `;

        const values = [
            uid,
            data.tenantUid,
            data.phoneNumber,
            data.leadUid || null,
            currentState,
            metadata,
            expiresAt
        ];

        const result = await this.db.query(query, values);
        return this.mapRow(result.rows[0]);
    }

    /**
     * Update session state, leadUid, metadata, and refresh interaction timestamp
     */
    async updateSession(
        uid: string,
        data: {
            leadUid?: string | null;
            currentState?: WhatsAppConversationState;
            metadata?: Record<string, unknown>;
            tenantUid?: string;
        }
    ): Promise<IWhatsAppCustomerSession | null> {
        const setClauses: string[] = ["last_interaction_at = CURRENT_TIMESTAMP", "updated_at = CURRENT_TIMESTAMP"];
        const values: any[] = [];
        let index = 1;

        if (data.leadUid !== undefined) {
            setClauses.push(`lead_uid = $${index++}`);
            values.push(data.leadUid);
        }

        if (data.currentState !== undefined) {
            setClauses.push(`current_state = $${index++}`);
            values.push(data.currentState);
        }

        if (data.metadata !== undefined) {
            setClauses.push(`metadata = $${index++}`);
            values.push(JSON.stringify(data.metadata));
        }

        if (data.tenantUid !== undefined) {
            setClauses.push(`tenant_uid = $${index++}`);
            values.push(data.tenantUid);
        }

        // Also refresh expires_at to +24 hours on interaction
        const newExpiresAt = new Date(Date.now() + WHATSAPP_SESSION_EXPIRY_HOURS * 60 * 60 * 1000);
        setClauses.push(`expires_at = $${index++}`);
        values.push(newExpiresAt);

        values.push(uid);

        const query = `
            UPDATE whatsapp_customer_sessions
            SET ${setClauses.join(", ")}
            WHERE uid = $${index} AND is_deleted = 0
            RETURNING *
        `;

        const result = await this.db.query(query, values);
        if (result.rows.length === 0) return null;
        return this.mapRow(result.rows[0]);
    }

    /**
     * Reset session back to Main Menu
     */
    async resetToMainMenu(uid: string): Promise<void> {
        const newExpiresAt = new Date(Date.now() + WHATSAPP_SESSION_EXPIRY_HOURS * 60 * 60 * 1000);
        const query = `
            UPDATE whatsapp_customer_sessions
            SET current_state = $1,
                last_interaction_at = CURRENT_TIMESTAMP,
                expires_at = $2,
                updated_at = CURRENT_TIMESTAMP
            WHERE uid = $3 AND is_deleted = 0
        `;
        await this.db.query(query, [WHATSAPP_CONVERSATION_STATE.MAIN_MENU, newExpiresAt, uid]);
    }
}
