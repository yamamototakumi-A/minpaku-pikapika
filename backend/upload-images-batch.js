require('dotenv').config();
const { Storage } = require('@google-cloud/storage');
const fs = require('fs');
const path = require('path');

async function uploadImagesBatch() {
  try {
    console.log('🚀 Starting batch image upload to GCS...');
    
    const storage = new Storage({
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
      keyFilename: process.env.GOOGLE_CLOUD_KEY_FILE,
    });

    const bucketName = process.env.GOOGLE_CLOUD_BUCKET_NAME;
    let bucket = storage.bucket(bucketName);

    // Check if bucket exists, create if not
    const [exists] = await bucket.exists();
    if (!exists) {
      console.log(`📦 Creating bucket: ${bucketName}`);
      await bucket.create();
      console.log(`✅ Bucket created: ${bucketName}`);
    } else {
      console.log(`✅ Bucket exists: ${bucketName}`);
    }

    // Define the folder structure for cleaning guidelines
    const roomTypes = ['キッチン', 'リビング', 'ベッド', 'トイレ', 'お風呂', '洗面台', '洗濯機', 'その他'];
    const stepsPerRoom = 3; // 3 steps per room type = 24 total images
    
    console.log(`📁 Uploading ${roomTypes.length * stepsPerRoom} images...`);
    
    for (let i = 0; i < roomTypes.length; i++) {
      const roomType = roomTypes[i];
      console.log(`\n🏠 Processing room: ${roomType}`);
      
      for (let step = 1; step <= stepsPerRoom; step++) {
        const fileName = `step-${step}.jpg`; // You can change this to match your actual image names
        const gcsPath = `cleaning-guidelines/${roomType}/step-${step}/${fileName}`;
        
        // Create a placeholder image or use existing one
        const imageBuffer = createPlaceholderImage(roomType, step);
        
        try {
          const file = bucket.file(gcsPath);
          await file.save(imageBuffer, {
            metadata: {
              contentType: 'image/jpeg',
              metadata: {
                roomType: roomType,
                stepNumber: step,
                uploadedAt: new Date().toISOString()
              }
            }
          });
          
          console.log(`  ✅ Step ${step}: ${gcsPath}`);
        } catch (error) {
          console.error(`  ❌ Step ${step} failed:`, error.message);
        }
      }
    }
    
    console.log('\n🎉 Batch upload completed!');
    
    // List uploaded files
    const [files] = await bucket.getFiles({ prefix: 'cleaning-guidelines/' });
    console.log(`\n📊 Total files uploaded: ${files.length}`);
    
  } catch (error) {
    console.error('❌ Upload failed:', error.message);
  }
}

function createPlaceholderImage(roomType, step) {
  // Create a simple placeholder image buffer
  // In production, you would read actual image files
  const svg = `<svg width="300" height="200" xmlns="http://www.w3.org/2000/svg">
    <rect width="300" height="200" fill="#f0f0f0"/>
    <text x="150" y="100" text-anchor="middle" fill="#666" font-family="Arial" font-size="16">
      ${roomType} - Step ${step}
    </text>
  </svg>`;
  
  return Buffer.from(svg);
}

uploadImagesBatch();
