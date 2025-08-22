require('dotenv').config();
const { Storage } = require('@google-cloud/storage');

async function uploadImagesDirect() {
  try {
    console.log('🚀 Starting direct image upload to GCS...');
    
    const storage = new Storage({
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
      keyFilename: process.env.GOOGLE_CLOUD_KEY_FILE,
    });

    const bucketName = process.env.GOOGLE_CLOUD_BUCKET_NAME;
    const bucket = storage.bucket(bucketName);

    // Define the folder structure for cleaning guidelines
    const roomTypes = ['キッチン', 'リビング', 'ベッド', 'トイレ', 'お風呂', '洗面台', '洗濯機', 'その他'];
    const stepsPerRoom = 3; // 3 steps per room type = 24 total images
    
    console.log(`📁 Uploading ${roomTypes.length * stepsPerRoom} images to bucket: ${bucketName}`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < roomTypes.length; i++) {
      const roomType = roomTypes[i];
      console.log(`\n🏠 Processing room: ${roomType}`);
      
      for (let step = 1; step <= stepsPerRoom; step++) {
        const fileName = `step-${step}.jpg`;
        const gcsPath = `cleaning-guidelines/${roomType}/step-${step}/${fileName}`;
        
        try {
          // Create a simple placeholder image
          const imageBuffer = createPlaceholderImage(roomType, step);
          
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
          successCount++;
        } catch (error) {
          console.error(`  ❌ Step ${step} failed:`, error.message);
          errorCount++;
        }
      }
    }
    
    console.log('\n🎉 Upload completed!');
    console.log(`✅ Successfully uploaded: ${successCount} images`);
    console.log(`❌ Failed uploads: ${errorCount} images`);
    
    if (successCount > 0) {
      console.log(`\n🌐 Your images are now available at:`);
      console.log(`https://storage.googleapis.com/${bucketName}/cleaning-guidelines/`);
    }
    
  } catch (error) {
    console.error('❌ Upload failed:', error.message);
  }
}

function createPlaceholderImage(roomType, step) {
  // Create a simple SVG placeholder
  const svg = `<svg width="300" height="200" xmlns="http://www.w3.org/2000/svg">
    <rect width="300" height="200" fill="#f0f0f0" stroke="#ccc" stroke-width="2"/>
    <text x="150" y="80" text-anchor="middle" fill="#333" font-family="Arial" font-size="18" font-weight="bold">
      ${roomType}
    </text>
    <text x="150" y="110" text-anchor="middle" fill="#666" font-family="Arial" font-size="14">
      Step ${step}
    </text>
    <text x="150" y="140" text-anchor="middle" fill="#999" font-family="Arial" font-size="12">
      Cleaning Guideline
    </text>
  </svg>`;
  
  return Buffer.from(svg);
}

uploadImagesDirect();
