require('dotenv').config();
const { Storage } = require('@google-cloud/storage');
const fs = require('fs');
const path = require('path');

async function fixGuidelineAccess() {
  try {
    console.log('🔧 Fixing guideline image access...');
    
    const storage = new Storage({
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
      keyFilename: process.env.GOOGLE_CLOUD_KEY_FILE,
    });

    const bucketName = process.env.GOOGLE_CLOUD_BUCKET_NAME;
    const bucket = storage.bucket(bucketName);
    
    // Guideline image mapping
    const guidelineImageMapping = {
      "トイレ": ["1-1", "1-2", "1-3"],
      "洗面台": ["2-1", "2-2"],
      "洗濯機": ["3-1"],
      "お風呂": ["4-1", "4-2", "4-3"],
      "キッチン": ["5-1", "5-2", "5-3", "5-4", "5-5", "5-6", "5-7"],
      "ベッド": ["6-1", "6-2"],
      "リビング": ["7-1", "7-2", "7-3", "7-4"],
      "その他": ["8-1", "8-2"]
    };

    // Get all image names
    const allImageNames = Object.values(guidelineImageMapping).flat();
    console.log(`📁 Found ${allImageNames.length} guideline images to check`);

    let successCount = 0;
    let failCount = 0;

    for (const imageName of allImageNames) {
      const gcsPath = `guidelines/${imageName}.png`;
      const file = bucket.file(gcsPath);
      
      try {
        console.log(`🔍 Checking: ${gcsPath}`);
        
        // Check if file exists
        const [exists] = await file.exists();
        if (!exists) {
          console.log(`❌ File not found: ${gcsPath}`);
          failCount++;
          continue;
        }

        // Get file metadata
        const [metadata] = await file.getMetadata();
        console.log(`✅ File exists: ${gcsPath}`);
        console.log(`   Size: ${metadata.size} bytes`);
        console.log(`   Content-Type: ${metadata.contentType}`);

        // Make file publicly readable
        try {
          await file.makePublic();
          console.log(`🔗 Made public: ${gcsPath}`);
          
          // Get public URL
          const publicUrl = `https://storage.googleapis.com/${bucketName}/${gcsPath}`;
          console.log(`🌐 Public URL: ${publicUrl}`);
          
          successCount++;
        } catch (publicError) {
          console.log(`⚠️  Could not make public: ${gcsPath} - ${publicError.message}`);
          failCount++;
        }

      } catch (error) {
        console.error(`❌ Error with ${gcsPath}:`, error.message);
        failCount++;
      }
    }

    console.log('\n📊 Summary:');
    console.log(`✅ Successfully processed: ${successCount}`);
    console.log(`❌ Failed: ${failCount}`);
    console.log(`📁 Total: ${allImageNames.length}`);

    if (successCount > 0) {
      console.log('\n🎉 Guideline images should now be publicly accessible!');
      console.log('🌐 Test URLs:');
      console.log(`   https://storage.googleapis.com/${bucketName}/guidelines/1-1.png`);
      console.log(`   https://storage.googleapis.com/${bucketName}/guidelines/2-1.png`);
    }

  } catch (error) {
    console.error('❌ Failed to fix guideline access:', error.message);
  }
}

fixGuidelineAccess();
