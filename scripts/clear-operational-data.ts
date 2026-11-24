import 'dotenv/config';
import readline from 'readline';
import pool from '../packages/connection.js';

/**
 * Script to clean all transactional/operational data:
 * - Leads
 * - Site Surveys & Survey Details/Documents
 * - Follow Ups
 * - Projects & Project Milestones/Documents
 * - Subsidy Trackers
 * - Quotations & Quotation Items
 * - Lead Notes
 * - Payments
 * - Lead/Survey/Project/Payment uploaded documents & associations
 * - Related Notifications & WhatsApp Customer Messages
 *
 * Master records (Users, Roles, Tenants, Products, Categories,
 * Brands, Document Types, Statuses, Milestone Templates) are preserved.
 */

async function confirmPrompt(message: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(message, (answer) => {
      rl.close();
      const trimmed = answer.trim().toLowerCase();
      resolve(trimmed === 'y' || trimmed === 'yes');
    });
  });
}

async function run() {
  const isForce = process.argv.includes('--force') || process.argv.includes('-f');

  console.log('================================================================');
  console.log('       SOLAR CRM - OPERATIONAL DATA PURGE SCRIPT                ');
  console.log('================================================================');
  console.log('⚠️  WARNING: This will PERMANENTLY delete:');
  console.log('   - All Leads & Lead Notes');
  console.log('   - All Follow Ups');
  console.log('   - All Site Surveys, Survey Details & Documents');
  console.log('   - All Quotations & Quotation Items');
  console.log('   - All Projects, Project Milestones & Milestone Photos');
  console.log('   - All Subsidy Trackers & Project Subsidy Documents');
  console.log('   - All Recorded Payments & Proofs');
  console.log('   - All Lead/Project/Survey Document Associations');
  console.log('   - All Customer WhatsApp Sessions & Operational Notifications');
  console.log('');
  console.log('🔒 PRESERVED DATA (WILL NOT BE DELETED):');
  console.log('   - Users, Roles, Permissions & Tenants');
  console.log('   - Product Catalog (Categories, Brands, Units, Products, Specs)');
  console.log('   - Document Master & Franchise Document Types');
  console.log('   - Milestone Templates, Lead Statuses, Project Statuses');
  console.log('   - Bank Details, Company Settings & State Subsidy Rules');
  console.log('================================================================\n');

  if (!isForce) {
    const confirmed = await confirmPrompt('Are you sure you want to proceed? (Type "yes" or "y" to confirm): ');
    if (!confirmed) {
      console.log('\n❌ Operation cancelled by user. No data was deleted.\n');
      process.exit(0);
    }
  }

  const client = await pool.connect();

  try {
    console.log('\n⏳ Starting database transaction...\n');
    await client.query('BEGIN');

    // 1. Delete Quotation Children & Quotations
    const qItems = await client.query('DELETE FROM quotation_items');
    console.log(`[✓] Deleted ${qItems.rowCount ?? 0} quotation items`);

    const qScope = await client.query('DELETE FROM quotation_scope_of_work_items');
    console.log(`[✓] Deleted ${qScope.rowCount ?? 0} quotation scope items`);

    const qTerms = await client.query('DELETE FROM quotation_terms_conditions_items');
    console.log(`[✓] Deleted ${qTerms.rowCount ?? 0} quotation terms items`);

    const quotations = await client.query('DELETE FROM quotations');
    console.log(`[✓] Deleted ${quotations.rowCount ?? 0} quotations`);

    // 2. Delete Project Milestones, Documents, Subsidy Trackers & Projects
    const milestoneDocs = await client.query('DELETE FROM project_installation_milestone_documents');
    console.log(`[✓] Deleted ${milestoneDocs.rowCount ?? 0} project milestone documents/photos`);

    const milestoneRows = await client.query('DELETE FROM project_installation_milestones');
    console.log(`[✓] Deleted ${milestoneRows.rowCount ?? 0} project installation milestones`);

    const projSubsidyDocs = await client.query('DELETE FROM project_subsidy_documents');
    console.log(`[✓] Deleted ${projSubsidyDocs.rowCount ?? 0} project subsidy documents`);

    const subsidyTrackers = await client.query('DELETE FROM subsidy_trackers');
    console.log(`[✓] Deleted ${subsidyTrackers.rowCount ?? 0} subsidy tracker records`);

    const payments = await client.query('DELETE FROM payments');
    console.log(`[✓] Deleted ${payments.rowCount ?? 0} payment records`);

    const projects = await client.query('DELETE FROM projects');
    console.log(`[✓] Deleted ${projects.rowCount ?? 0} projects`);

    // 3. Delete Site Surveys, Details & Survey Documents
    const surveyDocs = await client.query('DELETE FROM site_survey_documents');
    console.log(`[✓] Deleted ${surveyDocs.rowCount ?? 0} site survey documents`);

    const surveyDetails = await client.query('DELETE FROM site_survey_details');
    console.log(`[✓] Deleted ${surveyDetails.rowCount ?? 0} site survey detail records`);

    const siteSurveys = await client.query('DELETE FROM site_surveys');
    console.log(`[✓] Deleted ${siteSurveys.rowCount ?? 0} site surveys`);

    // 4. Delete Follow Ups & Lead Notes
    const followUps = await client.query('DELETE FROM follow_ups');
    console.log(`[✓] Deleted ${followUps.rowCount ?? 0} follow ups`);

    const leadNotes = await client.query('DELETE FROM lead_notes');
    console.log(`[✓] Deleted ${leadNotes.rowCount ?? 0} lead notes`);

    // 5. Delete Document Associations & Master Documents linked to Leads/Surveys/Projects/Payments
    const docAssoc = await client.query(`
      DELETE FROM document_associations 
      WHERE module IN ('lead', 'site_survey', 'project', 'subsidy_tracker', 'finance', 'payment')
         OR context_type IN ('lead', 'site_survey', 'project', 'subsidy_tracker', 'finance', 'payment')
    `);
    console.log(`[✓] Deleted ${docAssoc.rowCount ?? 0} document associations`);

    const masterDocs = await client.query(`
      DELETE FROM master_documents 
      WHERE entity_type IN ('lead', 'site_survey', 'project', 'subsidy_tracker', 'finance', 'payment')
         OR entity_type IS NULL
    `);
    console.log(`[✓] Deleted ${masterDocs.rowCount ?? 0} uploaded master documents`);

    // 6. Delete WhatsApp Messages & Sessions
    const waMessages = await client.query('DELETE FROM whatsapp_messages');
    console.log(`[✓] Deleted ${waMessages.rowCount ?? 0} WhatsApp messages`);

    const waSessions = await client.query('DELETE FROM whatsapp_customer_sessions');
    console.log(`[✓] Deleted ${waSessions.rowCount ?? 0} WhatsApp customer sessions`);

    // 7. Delete Notifications
    const notifications = await client.query('DELETE FROM notifications');
    console.log(`[✓] Deleted ${notifications.rowCount ?? 0} notifications`);

    // 8. Delete All Leads
    const leads = await client.query('DELETE FROM leads');
    console.log(`[✓] Deleted ${leads.rowCount ?? 0} leads`);

    await client.query('COMMIT');
    console.log('\n================================================================');
    console.log('✅ SUCCESS: All operational data has been completely deleted!');
    console.log('   The database is clean and ready for fresh leads and projects.');
    console.log('================================================================\n');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n❌ ERROR: Transaction failed! Rolled back all changes:', error);
  } finally {
    client.release();
    await pool.end();
    process.exit(0);
  }
}

run();
