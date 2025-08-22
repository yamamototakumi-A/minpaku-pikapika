const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testFacilityCreation() {
  try {
    console.log('🧪 Testing facility creation...');
    
    // Check if facilities table has any records
    const facilities = await prisma.facility.findMany({
      select: { id: true, facilityId: true, name: true, address: true, createdAt: true }
    });
    
    console.log(`📊 Found ${facilities.length} facilities in database:`);
    facilities.forEach(facility => {
      console.log(`  - ID: ${facility.id}, FacilityID: ${facility.facilityId}, Name: ${facility.name}, Created: ${facility.createdAt}`);
    });
    
    // Check if there are any client users
    const clientUsers = await prisma.user.findMany({
      where: { userType: 'client' },
      select: { id: true, userId: true, facilityId: true, surname: true, mainName: true, createdAt: true }
    });
    
    console.log(`👥 Found ${clientUsers.length} client users:`);
    clientUsers.forEach(user => {
      console.log(`  - ID: ${user.id}, UserID: ${user.userId}, FacilityID: ${user.facilityId}, Name: ${user.surname} ${user.mainName}, Created: ${user.createdAt}`);
    });
    
    // Check if there's a mismatch between facilities and client users
    const facilityIds = facilities.map(f => f.facilityId);
    const userFacilityIds = clientUsers.map(u => u.facilityId).filter(Boolean);
    
    console.log('\n🔍 Checking for mismatches:');
    console.log(`  - Facilities in facilities table: ${facilityIds.join(', ')}`);
    console.log(`  - Facility IDs in user table: ${userFacilityIds.join(', ')}`);
    
    const missingFacilities = userFacilityIds.filter(id => !facilityIds.includes(id));
    if (missingFacilities.length > 0) {
      console.log(`❌ Missing facilities: ${missingFacilities.join(', ')}`);
    } else {
      console.log('✅ All client facility IDs have corresponding facility records');
    }
    
    const orphanedFacilities = facilityIds.filter(id => !userFacilityIds.includes(id));
    if (orphanedFacilities.length > 0) {
      console.log(`⚠️  Orphaned facilities (no client users): ${orphanedFacilities.join(', ')}`);
    }
    
  } catch (error) {
    console.error('❌ Error testing facility creation:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testFacilityCreation();
