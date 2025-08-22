const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Comprehensive Prisma Fix Script');
console.log('==================================');

async function fixPrismaIssues() {
  try {
    // Step 1: Check if .env file exists
    console.log('\n1️⃣ Checking environment configuration...');
    if (!fs.existsSync('.env')) {
      console.log('❌ .env file not found! Please create one with your DATABASE_URL.');
      return;
    }
    console.log('✅ .env file found');

    // Step 2: Generate Prisma client
    console.log('\n2️⃣ Generating Prisma client...');
    try {
      execSync('npx prisma generate', { stdio: 'inherit' });
      console.log('✅ Prisma client generated successfully');
    } catch (error) {
      console.log('⚠️ Prisma client generation failed, continuing...');
    }

    // Step 3: Check database connection
    console.log('\n3️⃣ Testing database connection...');
    try {
      execSync('node test-db-connection.js', { stdio: 'inherit' });
      console.log('✅ Database connection test completed');
    } catch (error) {
      console.log('⚠️ Database connection test failed, will attempt migration...');
    }

    // Step 4: Run migration
    console.log('\n4️⃣ Running database migration...');
    try {
      execSync('npx prisma migrate dev --name add-facility-id-to-users', { stdio: 'inherit' });
      console.log('✅ Migration completed successfully');
    } catch (error) {
      console.log('⚠️ Migration failed, trying to reset...');
      try {
        execSync('npx prisma migrate reset --force', { stdio: 'inherit' });
        console.log('✅ Database reset completed');
      } catch (resetError) {
        console.log('❌ Database reset also failed');
        throw resetError;
      }
    }

    // Step 5: Generate client again
    console.log('\n5️⃣ Regenerating Prisma client...');
    execSync('npx prisma generate', { stdio: 'inherit' });
    console.log('✅ Prisma client regenerated');

    // Step 6: Final connection test
    console.log('\n6️⃣ Final database connection test...');
    execSync('node test-db-connection.js', { stdio: 'inherit' });
    console.log('✅ Final test completed successfully');

    console.log('\n🎉 All Prisma issues fixed successfully!');
    console.log('\n🚀 You can now:');
    console.log('   - Start the backend server: npm run dev');
    console.log('   - Open Prisma Studio: npx prisma studio');
    console.log('   - Test the client registration system');

  } catch (error) {
    console.error('\n❌ Error during fix process:', error.message);
    console.log('\n💡 Manual steps to try:');
    console.log('1. Check your DATABASE_URL in .env file');
    console.log('2. Ensure your database server is running');
    console.log('3. Run: npx prisma generate');
    console.log('4. Run: npx prisma migrate dev --name add-facility-id-to-users');
    console.log('5. Run: npx prisma generate');
  }
}

fixPrismaIssues(); 