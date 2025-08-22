/*
  Purge database rows for all tables except cleaning_guidelines.
  Usage:
    node scripts/purge-non-guidelines.js --yes

  Notes:
  - Only deletes data (rows). It does NOT drop tables.
  - Preserves all rows in cleaning_guidelines.
  - Requires DATABASE_URL to be set in backend/.env or environment.
*/

const { PrismaClient } = require('@prisma/client');

async function main() {
  const confirmed = process.argv.includes('--yes') || process.env.FORCE_PURGE === 'true';
  if (!confirmed) {
    console.error('Refusing to purge without confirmation. Re-run with --yes to proceed.');
    process.exit(1);
  }

  const prisma = new PrismaClient();

  try {
    console.log('Starting purge of non-guideline tables...');

    // Deletion order respects FK relationships
    // 1) Child tables that reference others
    const receiptImages = await prisma.receiptImage.deleteMany({});
    console.log(`Deleted receipt_images rows: ${receiptImages.count}`);

    const cleaningImages = await prisma.cleaningImage.deleteMany({});
    console.log(`Deleted cleaning_images rows: ${cleaningImages.count}`);

    const cleaningRecords = await prisma.cleaningRecord.deleteMany({});
    console.log(`Deleted cleaning_records rows: ${cleaningRecords.count}`);

    const clientApplications = await prisma.clientApplication.deleteMany({});
    console.log(`Deleted client_applications rows: ${clientApplications.count}`);

    const lineNotifications = await prisma.lineNotification.deleteMany({});
    console.log(`Deleted line_notifications rows: ${lineNotifications.count}`);

    // 2) Mid-level tables
    const users = await prisma.user.deleteMany({});
    console.log(`Deleted users rows: ${users.count}`);

    const facilities = await prisma.facility.deleteMany({});
    console.log(`Deleted facilities rows: ${facilities.count}`);

    // 3) Top-level tables
    const companies = await prisma.company.deleteMany({});
    console.log(`Deleted companies rows: ${companies.count}`);

    // Preserve cleaning_guidelines entirely
    const guidelinesCount = await prisma.cleaningGuideline.count();
    console.log(`Preserved cleaning_guidelines rows: ${guidelinesCount}`);

    console.log('Purge completed successfully.');
  } catch (error) {
    console.error('Purge failed:', error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();


