require('dotenv').config();
const { Storage } = require('@google-cloud/storage');
const fs = require('fs');
const path = require('path');

async function testPersonalUploadDirect() {
  try {
    console.log('🧪 Testing personal upload with current credentials...');
    console.log('📝 Using your personal account (bluewave97218@gmail.com)');
    
    // Try without specifying keyFilename to use your personal credentials
    const storage = new Storage({
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
      // Don't specify keyFilename - use your personal account
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
    const gcsPath = `test-personal/${fileName}`;
    
    // Read file
    const fileBuffer = fs.readFileSync(testFile);
    
    // Determine content type
    const ext = path.extname(testFile).toLowerCase();
    const contentType = getContentType(ext);
    
    console.log(`📤 Uploading to: ${gcsPath}`);
    console.log(`📦 Bucket: ${bucketName}`);
    console.log(`🔧 Content Type: ${contentType}`);
    console.log(`👤 Using account: bluewave97218@gmail.com (Cloud Storage for Firebase Admin + Editor)`);
    
    // Try the upload
    const file = bucket.file(gcsPath);
    await file.save(fileBuffer, {
      metadata: {
        contentType: contentType,
        metadata: {
          testUpload: 'true',
          uploadedBy: 'bluewave97218@gmail.com',
          originalPath: testFile,
          uploadedAt: new Date().toISOString()
        }
      }
    });
    
    console.log('✅ Upload successful!');
    console.log(`🌐 File available at: https://storage.googleapis.com/${bucketName}/${gcsPath}`);
    
    // Try to make it publicly readable
    try {
      await file.makePublic();
      console.log('✅ File made public for testing');
      console.log(`🔗 Public URL: https://storage.googleapis.com/${bucketName}/${gcsPath}`);
    } catch (publicError) {
      console.log('⚠️  Could not make file public (this is normal)');
    }
    
  } catch (error) {
    console.error('❌ Upload failed:', error.message);
    
    if (error.message.includes('403')) {
      console.log('\n💡 403 Forbidden - Your roles might not include upload permissions');
      console.log('📋 Your current roles:');
      console.log('   - Cloud Storage for Firebase Admin');
      console.log('   - Editor');
      console.log('\n🔧 You might need:');
      console.log('   - Storage Object Admin role');
      console.log('   - Or ask the owner to grant upload permissions');
    } else if (error.message.includes('authentication')) {
      console.log('\n💡 Authentication issue. You need to authenticate with your personal account.');
      console.log('📝 Try: gcloud auth application-default login');
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

testPersonalUploadDirect();
