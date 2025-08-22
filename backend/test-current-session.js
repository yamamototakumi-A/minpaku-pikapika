require('dotenv').config();
const { Storage } = require('@google-cloud/storage');
const fs = require('fs');
const path = require('path');

async function testCurrentSession() {
  try {
    console.log('🧪 Testing with current session...');
    console.log('👤 Your role: Admin Editor (should have full permissions)');
    
    // Try different authentication methods
    console.log('\n🔍 Trying different authentication approaches...');
    
    // Method 1: No credentials specified (use current session)
    console.log('\n📋 Method 1: No credentials specified');
    try {
      const storage1 = new Storage({
        projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
      });
      
      const bucket1 = storage1.bucket(process.env.GOOGLE_CLOUD_BUCKET_NAME);
      const [files1] = await bucket1.getFiles({ maxResults: 5 });
      console.log(`✅ Method 1 works! Found ${files1.length} files in bucket`);
      
      // Try to upload with this method
      await testUpload(storage1, 'method1-test');
      
    } catch (error) {
      console.log(`❌ Method 1 failed: ${error.message}`);
    }
    
    // Method 2: Try with service account but different approach
    console.log('\n📋 Method 2: Service account with different approach');
    try {
      const storage2 = new Storage({
        projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
        keyFilename: process.env.GOOGLE_CLOUD_KEY_FILE,
      });
      
      const bucket2 = storage2.bucket(process.env.GOOGLE_CLOUD_BUCKET_NAME);
      const [files2] = await bucket2.getFiles({ maxResults: 5 });
      console.log(`✅ Method 2 works! Found ${files2.length} files in bucket`);
      
      // Try to upload with this method
      await testUpload(storage2, 'method2-test');
      
    } catch (error) {
      console.log(`❌ Method 2 failed: ${error.message}`);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

async function testUpload(storage, methodName) {
  try {
    const bucketName = process.env.GOOGLE_CLOUD_BUCKET_NAME;
    const bucket = storage.bucket(bucketName);
    
    // Path to your guidelines folder
    const guidelinesPath = 'E:\\guidelines';
    
    if (!fs.existsSync(guidelinesPath)) {
      console.log(`❌ Guidelines folder not found: ${guidelinesPath}`);
      return;
    }
    
    // Get the first image file
    const files = getAllFiles(guidelinesPath);
    if (files.length === 0) {
      console.log('❌ No image files found');
      return;
    }
    
    const testFile = files[0];
    const fileName = path.basename(testFile);
    const gcsPath = `${methodName}/${fileName}`;
    
    console.log(`📤 Testing upload with ${methodName}: ${gcsPath}`);
    
    // Read file
    const fileBuffer = fs.readFileSync(testFile);
    const ext = path.extname(testFile).toLowerCase();
    const contentType = getContentType(ext);
    
    // Try the upload
    const file = bucket.file(gcsPath);
    await file.save(fileBuffer, {
      metadata: {
        contentType: contentType,
        metadata: {
          testUpload: 'true',
          method: methodName,
          uploadedAt: new Date().toISOString()
        }
      }
    });
    
    console.log(`✅ Upload successful with ${methodName}!`);
    console.log(`🌐 File available at: https://storage.googleapis.com/${bucketName}/${gcsPath}`);
    
    return true;
    
  } catch (error) {
    console.log(`❌ Upload failed with ${methodName}: ${error.message}`);
    return false;
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

testCurrentSession();
