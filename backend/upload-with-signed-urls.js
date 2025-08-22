require('dotenv').config();
const { Storage } = require('@google-cloud/storage');
const fs = require('fs');
const path = require('path');

async function uploadWithSignedUrls() {
  try {
    console.log('🚀 Starting upload with signed URLs...');
    
    const storage = new Storage({
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
      keyFilename: process.env.GOOGLE_CLOUD_KEY_FILE,
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
    
    console.log(`📁 Reading from: ${guidelinesPath}`);
    console.log(`📦 Uploading to bucket: ${bucketName}`);
    
    let successCount = 0;
    let errorCount = 0;
    
    // Get all files from the guidelines folder
    const files = getAllFiles(guidelinesPath);
    console.log(`📊 Found ${files.length} files to upload`);
    
    for (const filePath of files) {
      try {
        // Get relative path from guidelines folder
        const relativePath = path.relative(guidelinesPath, filePath);
        
        // Create GCS path (replace backslashes with forward slashes)
        const gcsPath = `cleaning-guidelines/${relativePath.replace(/\\/g, '/')}`;
        
        // Read file
        const fileBuffer = fs.readFileSync(filePath);
        
        // Determine content type
        const ext = path.extname(filePath).toLowerCase();
        const contentType = getContentType(ext);
        
        console.log(`  📤 Uploading: ${gcsPath}`);
        
        // Try direct upload first
        try {
          const file = bucket.file(gcsPath);
          await file.save(fileBuffer, {
            metadata: {
              contentType: contentType,
              metadata: {
                originalPath: filePath,
                uploadedAt: new Date().toISOString()
              }
            }
          });
          
          console.log(`  ✅ Direct upload successful: ${gcsPath}`);
          successCount++;
          
        } catch (directError) {
          console.log(`  ⚠️  Direct upload failed, trying signed URL...`);
          
          // Try with signed URL
          try {
            const [signedUrl] = await bucket.file(gcsPath).getSignedUrl({
              version: 'v4',
              action: 'write',
              expires: Date.now() + 15 * 60 * 1000, // 15 minutes
              contentType: contentType,
            });
            
            // Upload using signed URL
            const response = await fetch(signedUrl, {
              method: 'PUT',
              body: fileBuffer,
              headers: {
                'Content-Type': contentType,
              },
            });
            
            if (response.ok) {
              console.log(`  ✅ Signed URL upload successful: ${gcsPath}`);
              successCount++;
            } else {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
          } catch (signedError) {
            throw new Error(`Both direct and signed URL uploads failed: ${signedError.message}`);
          }
        }
        
      } catch (error) {
        console.error(`  ❌ Failed to upload ${filePath}:`, error.message);
        errorCount++;
      }
    }
    
    console.log('\n🎉 Upload completed!');
    console.log(`✅ Successfully uploaded: ${successCount} files`);
    console.log(`❌ Failed uploads: ${errorCount} files`);
    
    if (successCount > 0) {
      console.log(`\n🌐 Your images are now available at:`);
      console.log(`https://storage.googleapis.com/${bucketName}/cleaning-guidelines/`);
    }
    
  } catch (error) {
    console.error('❌ Upload failed:', error.message);
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

uploadWithSignedUrls();
