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

-- Quotations
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'quotation_items') THEN DELETE FROM quotation_items; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'quotation_scope_of_work_items') THEN DELETE FROM quotation_scope_of_work_items; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'quotation_terms_conditions_items') THEN DELETE FROM quotation_terms_conditions_items; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'quotations') THEN DELETE FROM quotations; END IF; END $$;

-- Projects, Milestones & Subsidies
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'project_installation_milestone_documents') THEN DELETE FROM project_installation_milestone_documents; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'project_installation_milestones') THEN DELETE FROM project_installation_milestones; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'project_subsidy_documents') THEN DELETE FROM project_subsidy_documents; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subsidy_trackers') THEN DELETE FROM subsidy_trackers; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payments') THEN DELETE FROM payments; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'projects') THEN DELETE FROM projects; END IF; END $$;

-- Surveys
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'site_survey_documents') THEN DELETE FROM site_survey_documents; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'site_survey_details') THEN DELETE FROM site_survey_details; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'site_surveys') THEN DELETE FROM site_surveys; END IF; END $$;

-- Follow Ups & Notes
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'follow_ups') THEN DELETE FROM follow_ups; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lead_notes') THEN DELETE FROM lead_notes; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notes') THEN DELETE FROM notes WHERE module IN ('lead', 'site_survey', 'project', 'subsidy_tracker', 'finance', 'payment'); END IF; END $$;

-- Documents & Associations
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'document_associations') THEN 
  DELETE FROM document_associations 
  WHERE module IN ('lead', 'site_survey', 'project', 'subsidy_tracker', 'finance', 'payment')
     OR context_type IN ('lead', 'site_survey', 'project', 'subsidy_tracker', 'finance', 'payment');
END IF; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'master_documents') THEN 
  DELETE FROM master_documents 
  WHERE entity_type IN ('lead', 'site_survey', 'project', 'subsidy_tracker', 'finance', 'payment')
     OR entity_type IS NULL;
END IF; END $$;

-- Communications & Logs
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'whatsapp_messages') THEN DELETE FROM whatsapp_messages; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'whatsapp_customer_sessions') THEN DELETE FROM whatsapp_customer_sessions; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN DELETE FROM notifications; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notification_logs') THEN DELETE FROM notification_logs; END IF; END $$;

-- Leads
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'leads') THEN DELETE FROM leads; END IF; END $$;

COMMIT;
