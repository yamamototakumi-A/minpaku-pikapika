require('dotenv').config();
const { Storage } = require('@google-cloud/storage');
const fs = require('fs');
const path = require('path');

async function testBrowserAuth() {
  try {
    console.log('🧪 Testing upload with browser authentication...');
    console.log('📝 Note: This will open a browser window for authentication');
    
    // Use Application Default Credentials (will prompt for browser auth)
    const storage = new Storage({
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
      // Don't specify keyFilename - will use browser auth
    });

    const bucketName = process.env.GOOGLE_CLOUD_BUCKET_NAME;
    const bucket = storage.bucket(bucketName);
    
    // Path to your guidelines folder
    const guidelinesPath = 'E:\\guidelines';
    
    // Check if the folder exists
    if (!fs.existsSync(guidelinesPath)) {
      console.error(`❌ Folder not found: ${guidelinesPath}`);
      return;
    }
    
    // Get just the first image file
    const files = getAllFiles(guidelinesPath);
    if (files.length === 0) {
      console.error('❌ No image files found in the guidelines folder');
      return;
    }
    
    const testFile = files[0];
    console.log(`📁 Testing with file: ${testFile}`);
    
    // Create a simple test path
    const fileName = path.basename(testFile);
    const gcsPath = `test-browser-upload/${fileName}`;
    
    // Read file
    const fileBuffer = fs.readFileSync(testFile);
    
    // Determine content type
    const ext = path.extname(testFile).toLowerCase();
    const contentType = getContentType(ext);
    
    console.log(`📤 Uploading to: ${gcsPath}`);
    console.log(`📦 Bucket: ${bucketName}`);
    console.log(`🔧 Content Type: ${contentType}`);
    
    // Try the upload
    const file = bucket.file(gcsPath);
    await file.save(fileBuffer, {
      metadata: {
        contentType: contentType,
        metadata: {
          testUpload: 'true',
          uploadedBy: 'browser-auth',
          originalPath: testFile,
          uploadedAt: new Date().toISOString()
        }
      }
    });
    
    console.log('✅ Upload successful!');
    console.log(`🌐 File available at: https://storage.googleapis.com/${bucketName}/${gcsPath}`);
    
  } catch (error) {
    console.error('❌ Upload failed:', error.message);
    
    if (error.message.includes('403')) {
      console.log('\n💡 To fix this, you need to:');
      console.log('1. Install Google Cloud CLI: https://cloud.google.com/sdk/docs/install');
      console.log('2. Run: gcloud auth application-default login');
      console.log('3. Or ask the owner to grant you Storage Object Admin role');
    } else if (error.message.includes('authentication')) {
      console.log('\n💡 Authentication issue. Try:');
      console.log('1. Install Google Cloud CLI');
      console.log('2. Run: gcloud auth application-default login');
    }
  }
}

function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);
  
  for (const file of files) {
    const fullPath = path.join(dirPath, file);
    
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
    } else {
      // Only include image files
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

testBrowserAuth();
