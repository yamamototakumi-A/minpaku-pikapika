require('dotenv').config();
const { Storage } = require('@google-cloud/storage');
const fs = require('fs');
const path = require('path');

async function uploadAllGuidelines() {
  try {
    console.log('🚀 Starting batch upload of all guidelines...');
    console.log('👤 Service Account: ratte-service@minpaku-cleaning-report-app.iam.gserviceaccount.com');
    console.log('📦 Bucket: pikapika-cleaning-2025');
    
    const storage = new Storage({
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
      keyFilename: process.env.GOOGLE_CLOUD_KEY_FILE,
    });

    const bucketName = process.env.GOOGLE_CLOUD_BUCKET_NAME;
    const bucket = storage.bucket(bucketName);
    
    // Path to your guidelines folder
    const guidelinesPath = 'E:\\guidelines';
    
    if (!fs.existsSync(guidelinesPath)) {
      console.error(`❌ Folder not found: ${guidelinesPath}`);
      return;
    }
    
    // Get all image files
    const files = getAllFiles(guidelinesPath);
    console.log(`📁 Found ${files.length} image files to upload`);
    
    if (files.length === 0) {
      console.error('❌ No image files found');
      return;
    }
    
    let successCount = 0;
    let failCount = 0;
    
    // Upload each file
    for (let i = 0; i < files.length; i++) {
      const filePath = files[i];
      const fileName = path.basename(filePath);
      const gcsPath = `guidelines/${fileName}`;
      
      try {
        console.log(`📤 [${i + 1}/${files.length}] Uploading: ${fileName}`);
        
        // Read file
        const fileBuffer = fs.readFileSync(filePath);
        const ext = path.extname(filePath).toLowerCase();
        const contentType = getContentType(ext);
        
        // Upload to GCS
        const file = bucket.file(gcsPath);
        await file.save(fileBuffer, {
          metadata: {
            contentType: contentType,
            metadata: {
              originalPath: filePath,
              uploadedAt: new Date().toISOString(),
              batchUpload: 'true'
            }
          }
        });
        
        console.log(`✅ [${i + 1}/${files.length}] Success: ${fileName}`);
        successCount++;
        
        // Make it publicly readable
        try {
          await file.makePublic();
          console.log(`🔗 [${i + 1}/${files.length}] Made public: ${fileName}`);
        } catch (publicError) {
          console.log(`⚠️  [${i + 1}/${files.length}] Could not make public: ${fileName}`);
        }
        
      } catch (error) {
        console.error(`❌ [${i + 1}/${files.length}] Failed: ${fileName} - ${error.message}`);
        failCount++;
      }
    }
    
    // Summary
    console.log('\n📊 Upload Summary:');
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Failed: ${failCount}`);
    console.log(`📁 Total: ${files.length}`);
    
    if (successCount > 0) {
      console.log('\n🎉 Guidelines uploaded successfully!');
      console.log(`🌐 View files at: https://console.cloud.google.com/storage/browser/${bucketName}/guidelines`);
    }
    
  } catch (error) {
    console.error('❌ Batch upload failed:', error.message);
  }
}

function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);
  
  for (const file of files) {
    const fullPath = path.join(dirPath, file);
    
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
    } else {
      const ext = path.extname(file).toLowerCase();
      if (['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'].includes(ext)) {
        arrayOfFiles.push(fullPath);
      }
    }
  }
  
  return arrayOfFiles;
}

function getContentType(extension) {
  const contentTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.bmp': 'image/bmp',
    '.webp': 'image/webp'
  };
  
  return contentTypes[extension] || 'application/octet-stream';
}

uploadAllGuidelines();
