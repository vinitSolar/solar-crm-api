/**
 * WhatsApp Self-Service Module — Interfaces & Types
 */

import type { WhatsAppConversationState } from "../constants/whatsapp-self-service.constants.js";

export interface IWhatsAppCustomerSession {
    id: string;
    uid: string;
    tenantUid: string;
    phoneNumber: string;
    leadUid: string | null;
    currentState: WhatsAppConversationState;
    metadata: {
        candidateLeadUids?: string[];
        [key: string]: unknown;
    };
    lastInteractionAt: Date;
    expiresAt: Date | null;
    isActive: number;
    isDeleted: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface ICustomerLeadSummary {
    uid: string;
    tenantUid: string;
    leadNumber: string;
    firstName: string;
    lastName: string | null;
    fullName: string;
    systemSize: number | null;
    statusName: string;
    assignedTo: string | null;
    executiveName?: string | null;
    executiveEmail?: string | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface ISolarJourneyStage {
    name: string;
    statusIcon: "✅" | "🔄" | "⏳";
    statusText: string;
    date?: string | null;
}

export interface IAssignedExecutiveInfo {
    name: string;
    email?: string | null;
    phone?: string | null;
}
