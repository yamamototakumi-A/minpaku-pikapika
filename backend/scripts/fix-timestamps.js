const { PrismaClient } = require('@prisma/client');
const { toJst } = require('../utils/timezone');

const prisma = new PrismaClient();

async function fixTimestamps() {
  try {
    console.log('🔧 Starting Japanese timezone (JST) timestamp fix...');
    console.log('🌏 Converting all UTC timestamps to JST (UTC+9)...');
    
    // Fix User table timestamps
    console.log('📝 Fixing User table timestamps...');
    const users = await prisma.user.findMany({
      select: { id: true, createdAt: true, updatedAt: true }
    });
    
    for (const user of users) {
      const newCreatedAt = toJst(user.createdAt);
      const newUpdatedAt = toJst(user.updatedAt);
      
      await prisma.user.update({
        where: { id: user.id },
        data: {
          createdAt: newCreatedAt,
          updatedAt: newUpdatedAt
        }
      });
    }
    console.log(`✅ Fixed ${users.length} user records`);
    
    // Fix Company table timestamps
    console.log('🏢 Fixing Company table timestamps...');
    const companies = await prisma.company.findMany({
      select: { id: true, createdAt: true, updatedAt: true }
    });
    
    for (const company of companies) {
      const newCreatedAt = toJst(company.createdAt);
      const newUpdatedAt = toJst(company.updatedAt);
      
      await prisma.company.update({
        where: { id: company.id },
        data: {
          createdAt: newCreatedAt,
          updatedAt: newUpdatedAt
        }
      });
    }
    console.log(`✅ Fixed ${companies.length} company records`);
    
    // Fix Facility table timestamps
    console.log('🏗️ Fixing Facility table timestamps...');
    const facilities = await prisma.facility.findMany({
      select: { id: true, createdAt: true, updatedAt: true }
    });
    
    for (const facility of facilities) {
      const newCreatedAt = toJst(facility.createdAt);
      const newUpdatedAt = toJst(facility.updatedAt);
      
      await prisma.facility.update({
        where: { id: facility.id },
        data: {
          createdAt: newCreatedAt,
          updatedAt: newUpdatedAt
        }
      });
    }
    console.log(`✅ Fixed ${facilities.length} facility records`);
    
    // Fix CleaningImage table timestamps
    console.log('🖼️ Fixing CleaningImage table timestamps...');
    const cleaningImages = await prisma.cleaningImage.findMany({
      select: { id: true, uploadedAt: true, updatedAt: true }
    });
    
    for (const image of cleaningImages) {
      const newUploadedAt = toJst(image.uploadedAt);
      const newUpdatedAt = toJst(image.updatedAt);
      
      await prisma.cleaningImage.update({
        where: { id: image.id },
        data: {
          uploadedAt: newUploadedAt,
          updatedAt: newUpdatedAt
        }
      });
    }
    console.log(`✅ Fixed ${cleaningImages.length} cleaning image records`);
    
    // Fix CleaningRecord table timestamps
    console.log('📋 Fixing CleaningRecord table timestamps...');
    const cleaningRecords = await prisma.cleaningRecord.findMany({
      select: { id: true, createdAt: true, updatedAt: true }
    });
    
    for (const record of cleaningRecords) {
      const newCreatedAt = toJst(record.createdAt);
      const newUpdatedAt = toJst(record.updatedAt);
      
      await prisma.cleaningRecord.update({
        where: { id: record.id },
        data: {
          createdAt: newCreatedAt,
          updatedAt: newUpdatedAt
        }
      });
    }
    console.log(`✅ Fixed ${cleaningRecords.length} cleaning record records`);
    
    // Fix ClientApplication table timestamps
    console.log('📝 Fixing ClientApplication table timestamps...');
    const clientApps = await prisma.clientApplication.findMany({
      select: { id: true, createdAt: true, updatedAt: true }
    });
    
    for (const app of clientApps) {
      const newCreatedAt = toJst(app.createdAt);
      const newUpdatedAt = toJst(app.updatedAt);
      
      await prisma.clientApplication.update({
        where: { id: app.id },
        data: {
          createdAt: newCreatedAt,
          updatedAt: newUpdatedAt
        }
      });
    }
    console.log(`✅ Fixed ${clientApps.length} client application records`);
    
    console.log('🎉 All timestamps have been converted to Japanese timezone (JST)!');
    console.log('🇯🇵 System is now properly configured for Japanese cleaning company operations');
    
  } catch (error) {
    console.error('❌ Error fixing timestamps:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the fix
fixTimestamps();
