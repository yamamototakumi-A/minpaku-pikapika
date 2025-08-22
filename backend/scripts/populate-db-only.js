require('dotenv').config();
const { prisma } = require('../config/prisma');

// Room type mapping with image counts
const roomTypeMapping = {
  'トイレ': 3,
  '洗面台': 2,
  '洗濯機': 1,
  'お風呂': 3,
  'キッチン': 7,
  'ベッド': 2,
  'リビング': 4,
  'その他': 2
};

const bucketName = process.env.GOOGLE_CLOUD_BUCKET_NAME || 'pikapika-cleaning-2025';

// Insert guideline into database
const insertGuideline = async (roomType, stepNumber, title, description, imageUrl) => {
  try {
    const result = await prisma.cleaningGuideline.upsert({
      where: { roomType_stepNumber: { roomType, stepNumber } },
      update: { title, description, guidelineImageUrl: imageUrl },
      create: { roomType, stepNumber, title, description, guidelineImageUrl: imageUrl }
    });
    return result;
  } catch (error) {
    console.error(`Error inserting guideline for ${roomType} step ${stepNumber}:`, error);
    throw error;
  }
};

// Main function to populate guidelines
const populateGuidelines = async () => {
  try {
    console.log('🚀 Starting cleaning guidelines database population...');
    console.log(`📦 Using bucket: ${bucketName}`);

    for (const [roomType, imageCount] of Object.entries(roomTypeMapping)) {
      console.log(`\n📂 Processing ${roomType} (${imageCount} images)...`);
      
      for (let i = 1; i <= imageCount; i++) {
        const fileName = `${roomType === 'トイレ' ? '1' : 
                         roomType === '洗面台' ? '2' :
                         roomType === '洗濯機' ? '3' :
                         roomType === 'お風呂' ? '4' :
                         roomType === 'キッチン' ? '5' :
                         roomType === 'ベッド' ? '6' :
                         roomType === 'リビング' ? '7' :
                         roomType === 'その他' ? '8' : '0'}-${i}.png`;
        
        const imageUrl = `https://storage.googleapis.com/${bucketName}/guidelines/${fileName}`;
        const title = `${roomType}清掃 - ステップ${i}`;
        const description = `${roomType}の清掃作業のステップ${i}です。画像を参考に清掃を行ってください。`;
        
        console.log(`  💾 Adding ${fileName} (Step ${i})...`);
        
        try {
          const guideline = await insertGuideline(roomType, i, title, description, imageUrl);
          console.log(`  ✅ Saved to database: ${guideline.id}`);
        } catch (error) {
          console.error(`  ❌ Error processing ${fileName}:`, error.message);
        }
      }
    }

    console.log('\n✅ Cleaning guidelines database population completed!');
    
    // Show summary
    const summary = await prisma.cleaningGuideline.groupBy({ by: ['roomType'], _count: { _all: true }, orderBy: { roomType: 'asc' } });
    console.log('\n📊 Summary:');
    summary.forEach(row => {
      console.log(`  ${row.roomType}: ${row._count._all} guidelines`);
    });

  } catch (error) {
    console.error('❌ Error during population:', error);
  } finally {
    await prisma.$disconnect();
  }
};

// Run the script
if (require.main === module) {
  populateGuidelines();
}

module.exports = { populateGuidelines };
