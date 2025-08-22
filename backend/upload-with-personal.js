require('dotenv').config();
const { Storage } = require('@google-cloud/storage');
const fs = require('fs');
const path = require('path');

async function uploadWithPersonal() {
  try {
    console.log('🧪 Testing upload with personal credentials...');
    console.log('👤 Your account: bluewave97218@gmail.com');
    console.log('👑 Your role: Admin Editor');
    
    // Try to use personal credentials by not specifying keyFilename
    const storage = new Storage({
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
      // Don't specify keyFilename - let it use default credentials
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
    const gcsPath = `personal-test/${fileName}`;
    
    // Read file
    const fileBuffer = fs.readFileSync(testFile);
    
    // Determine content type
    const ext = path.extname(testFile).toLowerCase();
    const contentType = getContentType(ext);
    
    console.log(`📤 Uploading to: ${gcsPath}`);
    console.log(`📦 Bucket: ${bucketName}`);
    console.log(`🔧 Content Type: ${contentType}`);
    console.log(`👤 Using: bluewave97218@gmail.com (Admin Editor)`);
    
    // Try the upload
    const file = bucket.file(gcsPath);
    await file.save(fileBuffer, {
      metadata: {
        contentType: contentType,
        metadata: {
          testUpload: 'true',
          uploadedBy: 'bluewave97218@gmail.com',
          role: 'Admin Editor',
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
    
    console.log('\n🎉 Success! Your Admin Editor permissions are working!');
    
  } catch (error) {
    console.error('❌ Upload failed:', error.message);
    
    if (error.message.includes('Could not load the default credentials')) {
      console.log('\n💡 You need to authenticate with your personal account first.');
      console.log('📝 Options:');
      console.log('1. Install Google Cloud CLI and run: gcloud auth application-default login');
      console.log('2. Or ask the owner to grant the service account Storage Object Admin role');
      console.log('3. Or manually upload via GCP Console (which you can do)');
    } else if (error.message.includes('403')) {
      console.log('\n💡 403 Forbidden - Even with Admin Editor role, you might need to authenticate first.');
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

uploadWithPersonal();
