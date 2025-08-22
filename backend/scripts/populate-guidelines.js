const fs = require('fs');
const path = require('path');
const { Storage } = require('@google-cloud/storage');
require('dotenv').config();

// Initialize Google Cloud Storage with environment variables
const storage = new Storage({
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
  credentials: {
    client_email: process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_CLOUD_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }
});

const bucketName = process.env.GOOGLE_CLOUD_BUCKET_NAME || 'pikapika-cleaning-2025';
const bucket = storage.bucket(bucketName);

// Prisma
const { prisma } = require('../config/prisma');

// Room type mapping to folder names
const roomTypeMapping = {
  'トイレ': '1.トイレ',
  '洗面台': '2.洗面台',
  '洗濯機': '3.洗濯機',
  'お風呂': '4.お風呂',
  'キッチン': '5.キッチン',
  'ベッド': '6.ベッド',
  'リビング': '7.リビング',
  'その他': '8.その他'
};

// Upload image to Google Cloud Storage
const uploadImage = async (filePath, fileName) => {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    const blob = bucket.file(`guidelines/${fileName}`);
    
    const blobStream = blob.createWriteStream({
      metadata: {
        contentType: 'image/png',
      },
      resumable: false,
    });

    return new Promise((resolve, reject) => {
      blobStream.on('error', (error) => {
        reject(error);
      });

      blobStream.on('finish', async () => {
        await blob.makePublic();
        const publicUrl = `https://storage.googleapis.com/${bucketName}/guidelines/${fileName}`;
        resolve(publicUrl);
      });

      blobStream.end(fileBuffer);
    });
  } catch (error) {
    console.error(`Error uploading ${fileName}:`, error);
    throw error;
  }
};

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
    console.log('🚀 Starting cleaning guidelines population...');
    
    // Path to ITEMS folder (relative to project root)
    const itemsPath = path.join(__dirname, '../../ITEMS');
    
    if (!fs.existsSync(itemsPath)) {
      console.error('❌ ITEMS folder not found at:', itemsPath);
      process.exit(1);
    }

    console.log('📁 Found ITEMS folder at:', itemsPath);

    for (const [roomType, folderName] of Object.entries(roomTypeMapping)) {
      const folderPath = path.join(itemsPath, folderName);
      
      if (!fs.existsSync(folderPath)) {
        console.log(`⚠️  Folder not found: ${folderName}, skipping...`);
        continue;
      }

      console.log(`\n📂 Processing ${roomType} (${folderName})...`);
      
      const files = fs.readdirSync(folderPath)
        .filter(file => file.endsWith('.png'))
        .sort(); // Sort to ensure correct order

      if (files.length === 0) {
        console.log(`⚠️  No PNG files found in ${folderName}`);
        continue;
      }

      console.log(`📸 Found ${files.length} images:`, files);

      for (let i = 0; i < files.length; i++) {
        const fileName = files[i];
        const filePath = path.join(folderPath, fileName);
        const stepNumber = i + 1;
        
        console.log(`  📤 Uploading ${fileName} (Step ${stepNumber})...`);
        
        try {
          // Upload to Google Cloud Storage
          const imageUrl = await uploadImage(filePath, fileName);
          console.log(`  ✅ Uploaded: ${imageUrl}`);
          
          // Create title and description based on room type and step
          const title = `${roomType}清掃 - ステップ${stepNumber}`;
          const description = `${roomType}の清掃作業のステップ${stepNumber}です。画像を参考に清掃を行ってください。`;
          
          // Insert into database
          const guideline = await insertGuideline(roomType, stepNumber, title, description, imageUrl);
          console.log(`  💾 Saved to database: ${guideline.id}`);
          
        } catch (error) {
          console.error(`  ❌ Error processing ${fileName}:`, error.message);
        }
      }
    }

    console.log('\n✅ Cleaning guidelines population completed!');
    
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
