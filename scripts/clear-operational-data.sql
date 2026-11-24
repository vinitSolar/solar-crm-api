-- ====================================================================
-- SOLAR CRM - OPERATIONAL DATA CLEANUP SCRIPT
-- ====================================================================
-- This script permanently deletes all:
--   1. Quotations and quotation items
--   2. Projects, milestones, milestone documents, and subsidy trackers
--   3. Payments
--   4. Site surveys, survey details, and survey documents
--   5. Follow-ups
--   6. Lead notes
--   7. Lead/Project/Survey/Payment documents & document associations
--   8. WhatsApp messages & customer sessions
--   9. Notifications
--  10. Leads
--
-- PRESERVED:
--   Users, Roles, Tenants, Products, Categories, Brands, Units, Specs,
--   Document Master Types, Franchise Document Types, Statuses, Bank Details.
-- ====================================================================

BEGIN;

-- 1. Quotations
DELETE FROM quotation_items;
DELETE FROM quotation_scope_of_work_items;
DELETE FROM quotation_terms_conditions_items;
DELETE FROM quotations;

-- 2. Projects & Milestones
DELETE FROM project_installation_milestone_documents;
DELETE FROM project_installation_milestones;
DELETE FROM project_subsidy_documents;
DELETE FROM subsidy_trackers;
DELETE FROM payments;
DELETE FROM projects;

-- 3. Surveys
DELETE FROM site_survey_documents;
DELETE FROM site_survey_details;
DELETE FROM site_surveys;

-- 4. Follow Ups & Notes
DELETE FROM follow_ups;
DELETE FROM lead_notes;

-- 5. Documents & Associations
DELETE FROM document_associations 
WHERE module IN ('lead', 'site_survey', 'project', 'subsidy_tracker', 'finance', 'payment')
   OR context_type IN ('lead', 'site_survey', 'project', 'subsidy_tracker', 'finance', 'payment');

DELETE FROM master_documents 
WHERE entity_type IN ('lead', 'site_survey', 'project', 'subsidy_tracker', 'finance', 'payment')
   OR entity_type IS NULL;

-- 6. Communications & Logs
DELETE FROM whatsapp_messages;
DELETE FROM whatsapp_customer_sessions;
DELETE FROM notifications;

-- 7. Leads
DELETE FROM leads;

COMMIT;
