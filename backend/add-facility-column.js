const { Client } = require('pg');
require('dotenv').config();

async function addFacilityColumn() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected to database');

    // Add facility_id column if it doesn't exist
    console.log('🔧 Adding facility_id column...');
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS facility_id VARCHAR(255)
    `);
    console.log('✅ facility_id column added');

    // Create index for performance
    console.log('📊 Creating index...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_facility_id 
      ON users(facility_id)
    `);
    console.log('✅ Index created');

    // Update existing client users to have facility_id
    console.log('🔄 Updating existing client users...');
    const result = await client.query(`
      UPDATE users 
      SET facility_id = REPLACE(user_id, 'client_', '') 
      WHERE user_id LIKE 'client_%' 
      AND facility_id IS NULL
    `);
    console.log(`✅ Updated ${result.rowCount} client users`);

    // Verify the changes
    console.log('🔍 Verifying changes...');
    const users = await client.query(`
      SELECT user_id, facility_id, user_type 
      FROM users 
      WHERE user_id LIKE 'client_%' 
      LIMIT 5
    `);
    console.log('✅ Sample client users:', users.rows);

    console.log('\n🎉 Database updated successfully!');
    console.log('You can now run: npx prisma generate');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\n💡 Try these manual steps:');
    console.error('1. Connect to your database directly');
    console.error('2. Run: ALTER TABLE users ADD COLUMN facility_id VARCHAR(255);');
    console.error('3. Run: CREATE INDEX idx_users_facility_id ON users(facility_id);');
    console.error('4. Run: UPDATE users SET facility_id = REPLACE(user_id, \'client_\', \'\') WHERE user_id LIKE \'client_%\';');
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

addFacilityColumn(); 