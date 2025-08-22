require('dotenv').config();
const { Storage } = require('@google-cloud/storage');
const fs = require('fs');
const path = require('path');

async function testEnvAuth() {
  try {
    console.log('🧪 Testing environment-based authentication...');
    console.log('👤 Your role: Admin Editor (should have full permissions)');
    
    // Check what environment variables we have
    console.log('\n🔍 Environment variables:');
    console.log(`GOOGLE_CLOUD_PROJECT_ID: ${process.env.GOOGLE_CLOUD_PROJECT_ID}`);
    console.log(`GOOGLE_CLOUD_BUCKET_NAME: ${process.env.GOOGLE_CLOUD_BUCKET_NAME}`);
    console.log(`GOOGLE_CLOUD_KEY_FILE: ${process.env.GOOGLE_CLOUD_KEY_FILE}`);
    console.log(`GOOGLE_APPLICATION_CREDENTIALS: ${process.env.GOOGLE_APPLICATION_CREDENTIALS}`);
    
    // Try to use GOOGLE_APPLICATION_CREDENTIALS if set
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      console.log('\n📋 Method: Using GOOGLE_APPLICATION_CREDENTIALS');
      try {
        const storage = new Storage({
          projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
          keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
        });
        
        await testUploadWithStorage(storage, 'env-credentials');
      } catch (error) {
        console.log(`❌ Failed: ${error.message}`);
      }
    }
    
    // Try to create a new service account key with your permissions
    console.log('\n💡 Alternative: Create a new service account key');
    console.log('Since you have Admin Editor permissions, you can:');
    console.log('1. Go to: https://console.cloud.google.com/iam-admin/serviceaccounts');
    console.log('2. Create a new service account');
    console.log('3. Grant it Storage Object Admin role');
    console.log('4. Download the new key file');
    
    // Try to use your current session in a different way
    console.log('\n📋 Method: Try to use current browser session');
    console.log('You might need to authenticate via browser first');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

async function testUploadWithStorage(storage, methodName) {
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

testEnvAuth();
