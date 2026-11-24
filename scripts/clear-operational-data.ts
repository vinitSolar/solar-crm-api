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

async function safeDelete(
  client: any,
  tableName: string,
  whereClause: string = ''
): Promise<{ rowCount: number; existed: boolean }> {
  const check = await client.query(
    `SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1`,
    [tableName]
  );
  if ((check.rowCount ?? 0) === 0) {
    return { rowCount: 0, existed: false };
  }
  const query = whereClause ? `DELETE FROM "${tableName}" WHERE ${whereClause}` : `DELETE FROM "${tableName}"`;
  const result = await client.query(query);
  return { rowCount: result.rowCount ?? 0, existed: true };
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
    const qItems = await safeDelete(client, 'quotation_items');
    if (qItems.existed) console.log(`[✓] Deleted ${qItems.rowCount} quotation items`);

    const qScope = await safeDelete(client, 'quotation_scope_of_work_items');
    if (qScope.existed) console.log(`[✓] Deleted ${qScope.rowCount} quotation scope items`);

    const qTerms = await safeDelete(client, 'quotation_terms_conditions_items');
    if (qTerms.existed) console.log(`[✓] Deleted ${qTerms.rowCount} quotation terms items`);

    const quotations = await safeDelete(client, 'quotations');
    if (quotations.existed) console.log(`[✓] Deleted ${quotations.rowCount} quotations`);

    // 2. Delete Project Milestones, Documents, Subsidy Trackers & Projects
    const milestoneDocs = await safeDelete(client, 'project_installation_milestone_documents');
    if (milestoneDocs.existed) console.log(`[✓] Deleted ${milestoneDocs.rowCount} project milestone documents/photos`);

    const milestoneRows = await safeDelete(client, 'project_installation_milestones');
    if (milestoneRows.existed) console.log(`[✓] Deleted ${milestoneRows.rowCount} project installation milestones`);

    const projSubsidyDocs = await safeDelete(client, 'project_subsidy_documents');
    if (projSubsidyDocs.existed) console.log(`[✓] Deleted ${projSubsidyDocs.rowCount} project subsidy documents`);

    const subsidyTrackers = await safeDelete(client, 'subsidy_trackers');
    if (subsidyTrackers.existed) console.log(`[✓] Deleted ${subsidyTrackers.rowCount} subsidy tracker records`);

    const payments = await safeDelete(client, 'payments');
    if (payments.existed) console.log(`[✓] Deleted ${payments.rowCount} payment records`);

    const projects = await safeDelete(client, 'projects');
    if (projects.existed) console.log(`[✓] Deleted ${projects.rowCount} projects`);

    // 3. Delete Site Surveys, Details & Survey Documents
    const surveyDocs = await safeDelete(client, 'site_survey_documents');
    if (surveyDocs.existed) console.log(`[✓] Deleted ${surveyDocs.rowCount} site survey documents`);

    const surveyDetails = await safeDelete(client, 'site_survey_details');
    if (surveyDetails.existed) console.log(`[✓] Deleted ${surveyDetails.rowCount} site survey detail records`);

    const siteSurveys = await safeDelete(client, 'site_surveys');
    if (siteSurveys.existed) console.log(`[✓] Deleted ${siteSurveys.rowCount} site surveys`);

    // 4. Delete Follow Ups & Notes
    const followUps = await safeDelete(client, 'follow_ups');
    if (followUps.existed) console.log(`[✓] Deleted ${followUps.rowCount} follow ups`);

    const leadNotes = await safeDelete(client, 'lead_notes');
    if (leadNotes.existed) console.log(`[✓] Deleted ${leadNotes.rowCount} lead notes`);

    const notes = await safeDelete(
      client,
      'notes',
      `module IN ('lead', 'site_survey', 'project', 'subsidy_tracker', 'finance', 'payment')`
    );
    if (notes.existed) console.log(`[✓] Deleted ${notes.rowCount} operational notes`);

    // 5. Delete Document Associations & Master Documents linked to Leads/Surveys/Projects/Payments
    const docAssoc = await safeDelete(
      client,
      'document_associations',
      `module IN ('lead', 'site_survey', 'project', 'subsidy_tracker', 'finance', 'payment')`
    );
    if (docAssoc.existed) console.log(`[✓] Deleted ${docAssoc.rowCount} document associations`);

    const masterDocs = await safeDelete(
      client,
      'master_documents',
      `entity_type IN ('customer', 'lead', 'site_survey', 'project', 'subsidy_tracker', 'finance', 'payment')
       OR entity_type IS NULL`
    );
    if (masterDocs.existed) console.log(`[✓] Deleted ${masterDocs.rowCount} uploaded master documents`);

    // 6. Delete WhatsApp Messages & Sessions
    const waMessages = await safeDelete(client, 'whatsapp_messages');
    if (waMessages.existed) console.log(`[✓] Deleted ${waMessages.rowCount} WhatsApp messages`);

    const waSessions = await safeDelete(client, 'whatsapp_customer_sessions');
    if (waSessions.existed) console.log(`[✓] Deleted ${waSessions.rowCount} WhatsApp customer sessions`);

    // 7. Delete Notifications
    const notifications = await safeDelete(client, 'notifications');
    if (notifications.existed) console.log(`[✓] Deleted ${notifications.rowCount} notifications`);

    const notifLogs = await safeDelete(client, 'notification_logs');
    if (notifLogs.existed) console.log(`[✓] Deleted ${notifLogs.rowCount} notification logs`);

    // 8. Delete All Leads
    const leads = await safeDelete(client, 'leads');
    if (leads.existed) console.log(`[✓] Deleted ${leads.rowCount} leads`);

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
