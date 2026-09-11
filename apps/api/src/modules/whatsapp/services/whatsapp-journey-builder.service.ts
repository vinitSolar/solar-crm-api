/**
 * WhatsApp Self-Service Module — Journey Builder Service
 *
 * Formats structured, customer-safe WhatsApp messages following project UI & communication guidelines.
 */

import dayjs from "dayjs";
import type {
    ICustomerLeadSummary,
    ISolarJourneyStage,
    IAssignedExecutiveInfo
} from "../interfaces/whatsapp-self-service.interface.js";
import { WHATSAPP_INTERACTIVE_ACTIONS, WHATSAPP_SELF_SERVICE_MESSAGES } from "../constants/whatsapp-self-service.constants.js";

export class WhatsAppJourneyBuilderService {
    /**
     * Format Indian Date (e.g. 15 Jan 2025)
     */
    private formatDate(date: Date | string | null | undefined): string {
        if (!date) return "";
        return dayjs(date).format("DD MMM YYYY");
    }

    /**
     * Build Meta WhatsApp Cloud API Interactive List Message for Main Menu
     */
    buildInteractiveMainMenu(isGuidance = false): Record<string, unknown> {
        const bodyText = isGuidance
            ? WHATSAPP_SELF_SERVICE_MESSAGES.GUIDANCE_BODY
            : WHATSAPP_SELF_SERVICE_MESSAGES.MAIN_MENU_BODY;

        return {
            type: "list",
            header: {
                type: "text",
                text: WHATSAPP_SELF_SERVICE_MESSAGES.MAIN_MENU_HEADER
            },
            body: {
                text: bodyText
            },
            action: {
                button: WHATSAPP_SELF_SERVICE_MESSAGES.VIEW_OPTIONS_BUTTON,
                sections: [
                    {
                        title: WHATSAPP_SELF_SERVICE_MESSAGES.SERVICES_SECTION_TITLE,
                        rows: [
                            {
                                id: WHATSAPP_INTERACTIVE_ACTIONS.APPLICATION_STATUS,
                                title: WHATSAPP_SELF_SERVICE_MESSAGES.OPTION_TITLE_STATUS,
                                description: WHATSAPP_SELF_SERVICE_MESSAGES.OPTION_DESC_STATUS
                            },
                            {
                                id: WHATSAPP_INTERACTIVE_ACTIONS.SOLAR_JOURNEY,
                                title: WHATSAPP_SELF_SERVICE_MESSAGES.OPTION_TITLE_JOURNEY,
                                description: WHATSAPP_SELF_SERVICE_MESSAGES.OPTION_DESC_JOURNEY
                            },
                            {
                                id: WHATSAPP_INTERACTIVE_ACTIONS.ASSIGNED_EXECUTIVE,
                                title: WHATSAPP_SELF_SERVICE_MESSAGES.OPTION_TITLE_EXECUTIVE,
                                description: WHATSAPP_SELF_SERVICE_MESSAGES.OPTION_DESC_EXECUTIVE
                            }
                        ]
                    }
                ]
            }
        };
    }

    /**
     * Build Meta WhatsApp Cloud API Interactive Reply Button Message
     */
    buildInteractiveButtonReply(bodyText: string): Record<string, unknown> {
        return {
            type: "button",
            body: {
                text: bodyText
            },
            action: {
                buttons: [
                    {
                        type: "reply",
                        reply: {
                            id: WHATSAPP_INTERACTIVE_ACTIONS.MAIN_MENU,
                            title: WHATSAPP_SELF_SERVICE_MESSAGES.MAIN_MENU_BUTTON_TITLE
                        }
                    }
                ]
            }
        };
    }

    /**
     * Build Main Menu Text Message (Fallback)
     */
    buildMainMenu(customerName: string): string {
        return (
`Hello ${customerName} 👋

Welcome to Sunselect Solar.

Please choose an option:

1. 📊 My Application Status
2. 📋 My Solar Journey
3. 👤 My Assigned Executive

0. 🏠 Main Menu`
        );
    }

    /**
     * Build Lead Selection Menu for multiple leads
     */
    buildLeadSelectionMenu(leads: ICustomerLeadSummary[]): string {
        const leadItems = leads.map((lead, idx) => {
            const sizeStr = lead.systemSize ? ` (${lead.systemSize} kW)` : "";
            return `${idx + 1}. ${lead.fullName} — ${lead.leadNumber}${sizeStr}`;
        }).join("\n");

        return (
`We found multiple solar applications associated with your number.

Please select an application:

${leadItems}

Reply with the number (e.g. 1 or 2) to continue.`
        );
    }

    /**
     * Build Application Status Message
     */
    buildApplicationStatus(
        lead: ICustomerLeadSummary,
        currentStage: string,
        lastUpdatedDate: Date
    ): string {
        const formattedDate = this.formatDate(lastUpdatedDate);

        return (
`📊 Your Application Status

Application No: ${lead.leadNumber}
Current Status: ${lead.statusName}
Current Stage: ${currentStage}
Last Updated: ${formattedDate}

Your solar application is currently in the ${currentStage} stage.`
        );
    }

    /**
     * Build Solar Journey Timeline Message
     */
    buildSolarJourney(
        lead: ICustomerLeadSummary,
        stages: ISolarJourneyStage[]
    ): string {
        const stageLines = stages.map((stage) => {
            const dateStr = stage.date ? `\n${stage.date}` : "";
            return `${stage.statusIcon} ${stage.name}\n${stage.statusText}${dateStr}`;
        }).join("\n\n");

        return (
`📋 Your Solar Journey

Application No: ${lead.leadNumber}

${stageLines}`
        );
    }

    /**
     * Build Assigned Executive Message
     */
    buildAssignedExecutive(executive: IAssignedExecutiveInfo | null): string {
        if (!executive || !executive.name) {
            return WHATSAPP_SELF_SERVICE_MESSAGES.NO_EXECUTIVE_ASSIGNED;
        }

        const phoneLine = executive.phone ? `\nPhone: ${executive.phone}` : "";
        const emailLine = executive.email ? `\nEmail: ${executive.email}` : "";

        return (
`👤 Your Assigned Solar Executive

Name: ${executive.name}${phoneLine}${emailLine}

You can contact your assigned executive for assistance with your solar journey.`
        );
    }

    /**
     * Dynamically construct journey stages from Lead, Survey, Quotation, and Project entities
     */
    deriveStages(
        lead: ICustomerLeadSummary,
        entities: {
            survey: { status: number; scheduledAt: Date; updatedAt: Date } | null;
            quotation: { quotationNumber: string; status: number; updatedAt: Date } | null;
            project: { projectNumber: string; statusName: string | null; updatedAt: Date } | null;
        }
    ): { stages: ISolarJourneyStage[]; currentStage: string; lastUpdated: Date } {
        const stages: ISolarJourneyStage[] = [];
        let currentStage = "Lead Discovery";
        let lastUpdated = lead.updatedAt || lead.createdAt;

        // Stage 1: Lead Registered
        stages.push({ name: "Lead Registered", statusIcon: "✅", statusText: "Application created", date: this.formatDate(lead.createdAt) });

        // Stage 2: Assigned to Solar Executive
        if (lead.assignedTo && lead.executiveName) {
            stages.push({ name: "Assigned to Solar Executive", statusIcon: "✅", statusText: `Assigned to ${lead.executiveName}`, date: this.formatDate(lead.updatedAt) });
            currentStage = "Executive Consultation";
        } else {
            stages.push({ name: "Assigned to Solar Executive", statusIcon: "⏳", statusText: "Pending executive assignment" });
        }

        // Stage 3: Site Survey
        if (entities.survey) {
            if (entities.survey.status === 1) {
                stages.push({ name: "Site Survey", statusIcon: "✅", statusText: "Technical survey completed", date: this.formatDate(entities.survey.updatedAt) });
                if (entities.survey.updatedAt > lastUpdated) lastUpdated = entities.survey.updatedAt;
                currentStage = "Quotation Preparation";
            } else if (entities.survey.status === 0 || entities.survey.status === 3) {
                stages.push({ name: "Site Survey", statusIcon: "🔄", statusText: `Scheduled on ${this.formatDate(entities.survey.scheduledAt)}`, date: this.formatDate(entities.survey.scheduledAt) });
                if (entities.survey.updatedAt > lastUpdated) lastUpdated = entities.survey.updatedAt;
                currentStage = "Site Survey Scheduled";
            } else {
                stages.push({ name: "Site Survey", statusIcon: "⏳", statusText: "Survey rescheduled / pending" });
            }
        } else {
            stages.push({ name: "Site Survey", statusIcon: "⏳", statusText: "Upcoming technical site survey" });
        }

        // Stage 4: Quotation
        if (entities.quotation) {
            if (entities.quotation.status === 2 || entities.quotation.status === 4) {
                stages.push({ name: "Quotation", statusIcon: "✅", statusText: `Proposal Approved (${entities.quotation.quotationNumber})`, date: this.formatDate(entities.quotation.updatedAt) });
                if (entities.quotation.updatedAt > lastUpdated) lastUpdated = entities.quotation.updatedAt;
                currentStage = "Solar Project Initialization";
            } else {
                stages.push({ name: "Quotation", statusIcon: "🔄", statusText: `Proposal Shared (${entities.quotation.quotationNumber})`, date: this.formatDate(entities.quotation.updatedAt) });
                if (entities.quotation.updatedAt > lastUpdated) lastUpdated = entities.quotation.updatedAt;
                currentStage = "Quotation Review";
            }
        } else {
            stages.push({ name: "Quotation", statusIcon: "⏳", statusText: "Custom system sizing & estimate" });
        }

        // Stage 5: Installation & Project Execution
        if (entities.project) {
            const pStatus = (entities.project.statusName || "").toLowerCase();
            if (pStatus === "commissioned" || pStatus === "completed") {
                stages.push({ name: "Solar Installation", statusIcon: "✅", statusText: `Installed & Commissioned (${entities.project.projectNumber})`, date: this.formatDate(entities.project.updatedAt) });
                stages.push({ name: "Project Completed", statusIcon: "✅", statusText: "System handed over successfully", date: this.formatDate(entities.project.updatedAt) });
                if (entities.project.updatedAt > lastUpdated) lastUpdated = entities.project.updatedAt;
                currentStage = "Commissioned & Live";
            } else {
                stages.push({ name: "Solar Installation", statusIcon: "🔄", statusText: `Project in progress: ${entities.project.statusName || "Execution"} (${entities.project.projectNumber})`, date: this.formatDate(entities.project.updatedAt) });
                stages.push({ name: "Project Completed", statusIcon: "⏳", statusText: "Pending final commissioning" });
                if (entities.project.updatedAt > lastUpdated) lastUpdated = entities.project.updatedAt;
                currentStage = `Installation (${entities.project.statusName || "In Progress"})`;
            }
        } else {
            stages.push({ name: "Solar Installation", statusIcon: "⏳", statusText: "Civil works, panel mounting & grid sync" });
            stages.push({ name: "Project Completed", statusIcon: "⏳", statusText: "Net metering & handover" });
        }

        return { stages, currentStage, lastUpdated };
    }
}
