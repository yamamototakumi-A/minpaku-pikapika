const { execSync } = require('child_process');
const path = require('path');

console.log('🔧 Fixing Prisma client issues...');

try {
  // 1. Generate Prisma client
  console.log('📦 Generating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  
  // 2. Run database migration
  console.log('🗄️ Running database migration...');
  execSync('npx prisma migrate dev --name add-facility-id-to-users', { stdio: 'inherit' });
  
  // 3. Generate client again after migration
  console.log('📦 Regenerating Prisma client after migration...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  
  console.log('✅ Prisma client fixed successfully!');
  console.log('🚀 You can now start the backend server with: npm run dev');
  
} catch (error) {
  console.error('❌ Error fixing Prisma client:', error.message);
  console.log('💡 Try running these commands manually:');
  console.log('1. npx prisma generate');
  console.log('2. npx prisma migrate dev --name add-facility-id-to-users');
  console.log('3. npx prisma generate');
} 