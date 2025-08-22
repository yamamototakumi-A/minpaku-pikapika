const { PrismaClient } = require('@prisma/client');
const { nowJst, toJst, formatJapaneseDate } = require('../utils/timezone');

const prisma = new PrismaClient();

async function setupJapaneseTimezone() {
  try {
    console.log('🇯🇵 Setting up Japanese timezone (JST) for the cleaning company system...');
    console.log('🌏 JST = UTC+9 hours');
    
    // Test current timezone
    const now = new Date();
    const jstNow = nowJst();
    
    console.log('\n📅 Current timezone test:');
    console.log(`  UTC time: ${now.toISOString()}`);
    console.log(`  JST time: ${jstNow.toISOString()}`);
    console.log(`  JST formatted: ${formatJapaneseDate(jstNow)}`);
    
    // Check database timezone
    console.log('\n🗄️ Checking database timezone configuration...');
    
    try {
      const result = await prisma.$queryRaw`SELECT current_setting('timezone') as timezone`;
      console.log(`  Database timezone: ${result[0].timezone}`);
      
      if (result[0].timezone !== 'Asia/Tokyo') {
        console.log('  ⚠️  Database timezone is not set to Asia/Tokyo');
        console.log('  💡 Consider setting timezone in PostgreSQL configuration');
      }
    } catch (error) {
      console.log('  ℹ️  Could not check database timezone (this is normal)');
    }
    
    // Test timestamp creation
    console.log('\n🧪 Testing timestamp creation...');
    
    const testUser = await prisma.user.create({
      data: {
        userId: 'test_timezone_user',
        passwordHash: 'test_hash',
        userType: 'client',
        surname: 'テスト',
        mainName: 'ユーザー',
        facilityId: 'TEST001',
        createdAt: nowJst(),
        updatedAt: nowJst(),
      },
      select: { id: true, createdAt: true, updatedAt: true }
    });
    
    console.log(`  Created test user with ID: ${testUser.id}`);
    console.log(`  Created at (raw): ${testUser.createdAt}`);
    console.log(`  Created at (JST): ${formatJapaneseDate(testUser.createdAt)}`);
    
    // Clean up test user
    await prisma.user.delete({ where: { id: testUser.id } });
    console.log('  ✅ Test user cleaned up');
    
    // Check existing records
    console.log('\n📊 Checking existing records...');
    
    const userCount = await prisma.user.count();
    const companyCount = await prisma.company.count();
    const facilityCount = await prisma.facility.count();
    
    console.log(`  Users: ${userCount}`);
    console.log(`  Companies: ${companyCount}`);
    console.log(`  Facilities: ${facilityCount}`);
    
    if (userCount > 0 || companyCount > 0 || facilityCount > 0) {
      console.log('\n🔧 To fix existing timestamps, run:');
      console.log('  node scripts/fix-timestamps.js');
    }
    
    console.log('\n🎉 Japanese timezone setup complete!');
    console.log('🇯🇵 System is now configured for Japanese cleaning company operations');
    console.log('\n📋 Next steps:');
    console.log('  1. Run timestamp fix script if you have existing data');
    console.log('  2. Restart the backend server');
    console.log('  3. Test client registration to verify facility creation');
    
  } catch (error) {
    console.error('❌ Error setting up Japanese timezone:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the setup
setupJapaneseTimezone();
