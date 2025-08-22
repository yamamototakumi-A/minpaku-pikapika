const { PrismaClient } = require('@prisma/client');

console.log('🔍 Testing database connection and Prisma client...');

async function testConnection() {
  const prisma = new PrismaClient();
  
  try {
    // Test basic connection
    console.log('📡 Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connection successful!');
    
    // Test a simple query
    console.log('🔍 Testing Prisma client...');
    const userCount = await prisma.user.count();
    console.log(`✅ Prisma client working! Found ${userCount} users in database.`);
    
    // Test the new facilityId field
    console.log('🔍 Testing new facilityId field...');
    const users = await prisma.user.findMany({
      select: {
        id: true,
        userId: true,
        facilityId: true,
        userType: true
      },
      take: 5
    });
    console.log('✅ facilityId field accessible! Sample users:', users);
    
  } catch (error) {
    console.error('❌ Error testing connection:', error.message);
    
    if (error.message.includes('Unknown column')) {
      console.log('💡 Database schema needs to be updated. Run: npx prisma migrate dev');
    } else if (error.message.includes('ENOENT') || error.message.includes('Cannot find module')) {
      console.log('💡 Prisma client needs to be generated. Run: npx prisma generate');
    } else if (error.message.includes('ECONNREFUSED') || error.message.includes('Connection')) {
      console.log('💡 Database server is not running or connection string is incorrect.');
    }
  } finally {
    await prisma.$disconnect();
  }
}

testConnection(); 