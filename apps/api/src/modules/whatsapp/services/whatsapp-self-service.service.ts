/**
 * WhatsApp Self-Service Module — Self-Service Orchestration Service
 *
 * Core handler for incoming WhatsApp customer messages, routing between:
 * - Identification & Tenant Isolation
 * - Single vs. Multiple Lead Resolution
 * - Session State Management
 * - Application Status, Dynamic Solar Journey, and Assigned Executive
 */

import { logger } from "@packages/logger/logger.js";
import {
    WHATSAPP_CONVERSATION_STATE,
    WHATSAPP_MENU_OPTIONS,
    WHATSAPP_NAV_RESET_COMMANDS,
    WHATSAPP_SELF_SERVICE_MESSAGES
} from "../constants/whatsapp-self-service.constants.js";
import type { ICustomerLeadSummary } from "../interfaces/whatsapp-self-service.interface.js";
import { WhatsAppSessionRepository } from "../repositories/whatsapp-session.repository.js";
import { WhatsAppSelfServiceRepository } from "../repositories/whatsapp-self-service.repository.js";
import { WhatsAppJourneyBuilderService } from "./whatsapp-journey-builder.service.js";

export class WhatsAppSelfServiceService {
    private readonly sessionRepo: WhatsAppSessionRepository;
    private readonly selfServiceRepo: WhatsAppSelfServiceRepository;
    private readonly journeyBuilder: WhatsAppJourneyBuilderService;

    constructor(
        sessionRepo = new WhatsAppSessionRepository(),
        selfServiceRepo = new WhatsAppSelfServiceRepository(),
        journeyBuilder = new WhatsAppJourneyBuilderService()
    ) {
        this.sessionRepo = sessionRepo;
        this.selfServiceRepo = selfServiceRepo;
        this.journeyBuilder = journeyBuilder;
    }

    /**
     * Normalize WhatsApp phone number to digits and extract 10-digit national number
     */
    normalizePhoneNumber(rawPhone: string): { normalizedPhone: string; national10Digit: string } {
        const normalizedPhone = rawPhone.replace(/[^0-9]/g, "");
        let national10Digit = normalizedPhone;

        if (normalizedPhone.startsWith("91") && normalizedPhone.length === 12) {
            national10Digit = normalizedPhone.substring(2);
        } else if (normalizedPhone.length > 10) {
            national10Digit = normalizedPhone.substring(normalizedPhone.length - 10);
        }

        return { normalizedPhone, national10Digit };
    }

    /**
     * Process incoming message and return customer-safe reply text
     */
    async handleIncomingMessage(
        fromNumber: string,
        incomingText: string
    ): Promise<string> {
        const cleanText = (incomingText || "").trim().toLowerCase();
        const { normalizedPhone, national10Digit } = this.normalizePhoneNumber(fromNumber);

        logger.info(`[WhatsAppSelfService] Processing message from ${normalizedPhone} ('${cleanText}')`);

        // 1. Search CRM for matching leads
        const matchingLeads = await this.selfServiceRepo.findLeadsByPhoneNumber(normalizedPhone, national10Digit);

        // CASE 3: Customer not found
        if (!matchingLeads || matchingLeads.length === 0) {
            logger.info(`[WhatsAppSelfService] No active lead found for phone ${normalizedPhone}. Sending not found.`);
            return WHATSAPP_SELF_SERVICE_MESSAGES.CUSTOMER_NOT_FOUND;
        }

        // 2. Fetch or initialize conversation session
        let session = await this.sessionRepo.findByPhoneNumber(normalizedPhone);

        // Check for session expiry (+24 hours)
        const isSessionExpired = session && session.expiresAt && session.expiresAt.getTime() < Date.now();
        if (isSessionExpired) {
            logger.info(`[WhatsAppSelfService] Session expired for ${normalizedPhone}. Resetting context.`);
            await this.sessionRepo.resetToMainMenu(session!.uid);
            session = await this.sessionRepo.findByPhoneNumber(normalizedPhone);
        }

        // 3. Resolve active lead context
        let activeLead: ICustomerLeadSummary | null = null;

        if (matchingLeads.length === 1 && matchingLeads[0]) {
            // CASE 1: Exactly one matching lead
            activeLead = matchingLeads[0];

            if (!session) {
                session = await this.sessionRepo.createSession({
                    tenantUid: activeLead.tenantUid,
                    phoneNumber: normalizedPhone,
                    leadUid: activeLead.uid,
                    currentState: WHATSAPP_CONVERSATION_STATE.MAIN_MENU
                });
            } else if (session.leadUid !== activeLead.uid) {
                session = await this.sessionRepo.updateSession(session.uid, {
                    leadUid: activeLead.uid,
                    tenantUid: activeLead.tenantUid
                });
            }
        } else {
            // CASE 2: Multiple matching leads
            const candidateUids = matchingLeads.map((l) => l.uid);

            // If session already exists with a valid selected lead from the matching list
            if (session && session.leadUid && candidateUids.includes(session.leadUid)) {
                // Customer has an active lead context
                activeLead = matchingLeads.find((l) => l.uid === session!.leadUid) || null;
            }

            // Check if user is currently in LEAD_SELECTION state selecting an option
            if (session && session.currentState === WHATSAPP_CONVERSATION_STATE.LEAD_SELECTION) {
                const selectedIndex = parseInt(cleanText, 10) - 1;
                const candidateList = (session.metadata?.candidateLeadUids as string[]) || candidateUids;

                if (!isNaN(selectedIndex) && selectedIndex >= 0 && selectedIndex < candidateList.length) {
                    const selectedUid = candidateList[selectedIndex];
                    activeLead = matchingLeads.find((l) => l.uid === selectedUid) || null;

                    if (activeLead) {
                        logger.info(`[WhatsAppSelfService] Customer selected lead ${activeLead.leadNumber} (${activeLead.uid})`);
                        await this.sessionRepo.updateSession(session.uid, {
                            leadUid: activeLead.uid,
                            tenantUid: activeLead.tenantUid,
                            currentState: WHATSAPP_CONVERSATION_STATE.MAIN_MENU,
                            metadata: { candidateLeadUids: candidateList }
                        });
                        return this.journeyBuilder.buildMainMenu(activeLead.firstName);
                    }
                }

                // If invalid selection number received in LEAD_SELECTION state
                return this.journeyBuilder.buildLeadSelectionMenu(matchingLeads);
            }

            // If no active lead is selected yet, prompt lead selection
            if (!activeLead) {
                logger.info(`[WhatsAppSelfService] Multiple leads found (${matchingLeads.length}) for ${normalizedPhone}. Prompting selection.`);
                if (!session) {
                    await this.sessionRepo.createSession({
                        tenantUid: matchingLeads[0]!.tenantUid,
                        phoneNumber: normalizedPhone,
                        leadUid: null,
                        currentState: WHATSAPP_CONVERSATION_STATE.LEAD_SELECTION,
                        metadata: { candidateLeadUids: candidateUids }
                    });
                } else {
                    await this.sessionRepo.updateSession(session.uid, {
                        leadUid: null,
                        currentState: WHATSAPP_CONVERSATION_STATE.LEAD_SELECTION,
                        metadata: { candidateLeadUids: candidateUids }
                    });
                }
                return this.journeyBuilder.buildLeadSelectionMenu(matchingLeads);
            }
        }

        if (!activeLead) {
            return WHATSAPP_SELF_SERVICE_MESSAGES.CUSTOMER_NOT_FOUND;
        }

        // 4. Handle Navigation Reset Commands ('0', 'menu', 'main menu', 'home', etc.)
        if (WHATSAPP_NAV_RESET_COMMANDS.has(cleanText)) {
            if (session) {
                await this.sessionRepo.updateSession(session.uid, {
                    currentState: WHATSAPP_CONVERSATION_STATE.MAIN_MENU
                });
            }
            return this.journeyBuilder.buildMainMenu(activeLead.firstName);
        }

        // 5. Handle Menu Selection Options
        switch (cleanText) {
            case WHATSAPP_MENU_OPTIONS.APPLICATION_STATUS: {
                // FEATURE 1: 📊 My Application Status
                const entities = await this.selfServiceRepo.getLeadWorkflowEntities(activeLead.tenantUid, activeLead.uid);
                const { currentStage, lastUpdated } = this.journeyBuilder.deriveStages(activeLead, entities);

                if (session) {
                    await this.sessionRepo.updateSession(session.uid, {
                        currentState: WHATSAPP_CONVERSATION_STATE.APPLICATION_STATUS
                    });
                }

                return this.journeyBuilder.buildApplicationStatus(activeLead, currentStage, lastUpdated);
            }

            case WHATSAPP_MENU_OPTIONS.SOLAR_JOURNEY: {
                // FEATURE 2: 📋 My Solar Journey
                const entities = await this.selfServiceRepo.getLeadWorkflowEntities(activeLead.tenantUid, activeLead.uid);
                const { stages } = this.journeyBuilder.deriveStages(activeLead, entities);

                if (session) {
                    await this.sessionRepo.updateSession(session.uid, {
                        currentState: WHATSAPP_CONVERSATION_STATE.SOLAR_JOURNEY
                    });
                }

                return this.journeyBuilder.buildSolarJourney(activeLead, stages);
            }

            case WHATSAPP_MENU_OPTIONS.ASSIGNED_EXECUTIVE: {
                // FEATURE 3: 👤 My Assigned Executive
                let executive = null;
                if (activeLead.assignedTo) {
                    executive = await this.selfServiceRepo.getAssignedExecutive(activeLead.tenantUid, activeLead.assignedTo);
                }

                if (session) {
                    await this.sessionRepo.updateSession(session.uid, {
                        currentState: WHATSAPP_CONVERSATION_STATE.ASSIGNED_EXECUTIVE
                    });
                }

                return this.journeyBuilder.buildAssignedExecutive(executive);
            }

            default: {
                // If the customer sends a greeting or first message while in MAIN_MENU
                if (session?.currentState === WHATSAPP_CONVERSATION_STATE.MAIN_MENU && (cleanText === "hi" || cleanText === "hello" || cleanText === "hey")) {
                    return this.journeyBuilder.buildMainMenu(activeLead.firstName);
                }

                // If currently viewing a sub-menu and sends an invalid choice, return invalid option message
                return WHATSAPP_SELF_SERVICE_MESSAGES.INVALID_OPTION;
            }
        }
    }
}
