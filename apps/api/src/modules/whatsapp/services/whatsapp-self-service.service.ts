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
    WHATSAPP_GREETINGS,
    WHATSAPP_INTERACTIVE_ACTIONS,
    WHATSAPP_MENU_OPTIONS,
    WHATSAPP_NAV_RESET_COMMANDS,
    WHATSAPP_SELF_SERVICE_MESSAGES
} from "../constants/whatsapp-self-service.constants.js";
import type { ICustomerLeadSummary } from "../interfaces/whatsapp-self-service.interface.js";
import { WhatsAppSessionRepository } from "../repositories/whatsapp-session.repository.js";
import { WhatsAppSelfServiceRepository } from "../repositories/whatsapp-self-service.repository.js";
import { WhatsAppJourneyBuilderService } from "./whatsapp-journey-builder.service.js";

export interface ISelfServiceResponse {
    type: "interactive" | "text";
    payload: Record<string, unknown> | string;
    text: string;
}

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
     * Process incoming message and return customer-safe reply (interactive or text)
     */
    async handleIncomingMessage(
        fromNumber: string,
        incomingText: string,
        interactiveId?: string | null
    ): Promise<ISelfServiceResponse> {
        const cleanText = (incomingText || "").trim().toLowerCase();
        const cleanInteractiveId = (interactiveId || "").trim().toLowerCase();
        const { normalizedPhone, national10Digit } = this.normalizePhoneNumber(fromNumber);

        logger.info(`[WhatsAppSelfService] Processing message from ${normalizedPhone} (text: '${cleanText}', interactiveId: '${cleanInteractiveId}')`);

        // 1. Search CRM for matching leads
        const matchingLeads = await this.selfServiceRepo.findLeadsByPhoneNumber(normalizedPhone, national10Digit);

        // CASE 3: Customer not found
        if (!matchingLeads || matchingLeads.length === 0) {
            logger.info(`[WhatsAppSelfService] No active lead found for phone ${normalizedPhone}. Sending not found.`);
            return {
                type: "text",
                payload: WHATSAPP_SELF_SERVICE_MESSAGES.CUSTOMER_NOT_FOUND,
                text: WHATSAPP_SELF_SERVICE_MESSAGES.CUSTOMER_NOT_FOUND
            };
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

            if (session && session.leadUid && candidateUids.includes(session.leadUid)) {
                activeLead = matchingLeads.find((l) => l.uid === session!.leadUid) || null;
            }

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
                        const menuPayload = this.journeyBuilder.buildInteractiveMainMenu(false);
                        return {
                            type: "interactive",
                            payload: menuPayload,
                            text: WHATSAPP_SELF_SERVICE_MESSAGES.MAIN_MENU_BODY
                        };
                    }
                }

                const leadSelectionText = this.journeyBuilder.buildLeadSelectionMenu(matchingLeads);
                return {
                    type: "text",
                    payload: leadSelectionText,
                    text: leadSelectionText
                };
            }

            if (!activeLead) {
                logger.info(`[WhatsAppSelfService] Multiple leads found (${matchingLeads.length}) for ${normalizedPhone}. Prompting selection.`);
                const leadSelectionText = this.journeyBuilder.buildLeadSelectionMenu(matchingLeads);
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
                return {
                    type: "text",
                    payload: leadSelectionText,
                    text: leadSelectionText
                };
            }
        }

        if (!activeLead) {
            return {
                type: "text",
                payload: WHATSAPP_SELF_SERVICE_MESSAGES.CUSTOMER_NOT_FOUND,
                text: WHATSAPP_SELF_SERVICE_MESSAGES.CUSTOMER_NOT_FOUND
            };
        }

        // ========================================
        // MESSAGE ROUTING PRIORITY
        // ========================================

        // 1. Check whether it is an Interactive List or Button Reply
        const isStatusAction = cleanInteractiveId === WHATSAPP_INTERACTIVE_ACTIONS.APPLICATION_STATUS
            || cleanText === WHATSAPP_INTERACTIVE_ACTIONS.APPLICATION_STATUS
            || cleanText === WHATSAPP_MENU_OPTIONS.APPLICATION_STATUS;

        const isJourneyAction = cleanInteractiveId === WHATSAPP_INTERACTIVE_ACTIONS.SOLAR_JOURNEY
            || cleanText === WHATSAPP_INTERACTIVE_ACTIONS.SOLAR_JOURNEY
            || cleanText === WHATSAPP_MENU_OPTIONS.SOLAR_JOURNEY;

        const isExecutiveAction = cleanInteractiveId === WHATSAPP_INTERACTIVE_ACTIONS.ASSIGNED_EXECUTIVE
            || cleanText === WHATSAPP_INTERACTIVE_ACTIONS.ASSIGNED_EXECUTIVE
            || cleanText === WHATSAPP_MENU_OPTIONS.ASSIGNED_EXECUTIVE;

        const isMainMenuAction = cleanInteractiveId === WHATSAPP_INTERACTIVE_ACTIONS.MAIN_MENU
            || cleanText === WHATSAPP_INTERACTIVE_ACTIONS.MAIN_MENU;

        if (isStatusAction) {
            const entities = await this.selfServiceRepo.getLeadWorkflowEntities(activeLead.tenantUid, activeLead.uid);
            const { currentStage, lastUpdated } = this.journeyBuilder.deriveStages(activeLead, entities);
            if (session) {
                await this.sessionRepo.updateSession(session.uid, { currentState: WHATSAPP_CONVERSATION_STATE.APPLICATION_STATUS });
            }
            const bodyText = this.journeyBuilder.buildApplicationStatus(activeLead, currentStage, lastUpdated);
            return {
                type: "interactive",
                payload: this.journeyBuilder.buildInteractiveButtonReply(bodyText),
                text: bodyText
            };
        }

        if (isJourneyAction) {
            const entities = await this.selfServiceRepo.getLeadWorkflowEntities(activeLead.tenantUid, activeLead.uid);
            const { stages } = this.journeyBuilder.deriveStages(activeLead, entities);
            if (session) {
                await this.sessionRepo.updateSession(session.uid, { currentState: WHATSAPP_CONVERSATION_STATE.SOLAR_JOURNEY });
            }
            const bodyText = this.journeyBuilder.buildSolarJourney(activeLead, stages);
            return {
                type: "interactive",
                payload: this.journeyBuilder.buildInteractiveButtonReply(bodyText),
                text: bodyText
            };
        }

        if (isExecutiveAction) {
            let executive = null;
            if (activeLead.assignedTo) {
                executive = await this.selfServiceRepo.getAssignedExecutive(activeLead.tenantUid, activeLead.assignedTo);
            }
            if (session) {
                await this.sessionRepo.updateSession(session.uid, { currentState: WHATSAPP_CONVERSATION_STATE.ASSIGNED_EXECUTIVE });
            }
            const bodyText = this.journeyBuilder.buildAssignedExecutive(executive);
            return {
                type: "interactive",
                payload: this.journeyBuilder.buildInteractiveButtonReply(bodyText),
                text: bodyText
            };
        }

        if (isMainMenuAction) {
            if (session) {
                await this.sessionRepo.updateSession(session.uid, { currentState: WHATSAPP_CONVERSATION_STATE.MAIN_MENU });
            }
            return {
                type: "interactive",
                payload: this.journeyBuilder.buildInteractiveMainMenu(false),
                text: WHATSAPP_SELF_SERVICE_MESSAGES.MAIN_MENU_BODY
            };
        }

        // 2. Check whether it is a normal greeting / navigation command
        const isGreetingOrCommand = WHATSAPP_GREETINGS.has(cleanText)
            || WHATSAPP_NAV_RESET_COMMANDS.has(cleanText)
            || cleanText.startsWith("hi ")
            || cleanText.startsWith("hello ")
            || cleanText.startsWith("good morning")
            || cleanText.startsWith("good afternoon")
            || cleanText.startsWith("good evening");

        if (isGreetingOrCommand) {
            if (session) {
                await this.sessionRepo.updateSession(session.uid, { currentState: WHATSAPP_CONVERSATION_STATE.MAIN_MENU });
            }
            return {
                type: "interactive",
                payload: this.journeyBuilder.buildInteractiveMainMenu(false),
                text: WHATSAPP_SELF_SERVICE_MESSAGES.MAIN_MENU_BODY
            };
        }

        // 3. Unknown text message: Politely guide the customer to the Interactive Main Menu (NEVER show error)
        logger.info(`[WhatsAppSelfService] Unrecognized message '${cleanText}' from ${normalizedPhone}. Guiding customer to Interactive Main Menu.`);
        if (session) {
            await this.sessionRepo.updateSession(session.uid, { currentState: WHATSAPP_CONVERSATION_STATE.MAIN_MENU });
        }
        return {
            type: "interactive",
            payload: this.journeyBuilder.buildInteractiveMainMenu(true),
            text: WHATSAPP_SELF_SERVICE_MESSAGES.GUIDANCE_BODY
        };
    }
}
