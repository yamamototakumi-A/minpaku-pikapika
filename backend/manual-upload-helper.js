const fs = require('fs');
const path = require('path');

function prepareManualUpload() {
  console.log('📋 Manual Upload Helper');
  console.log('=======================\n');
  
  // Path to your guidelines folder
  const guidelinesPath = 'E:\\guidelines';
  
  // Check if the folder exists
  if (!fs.existsSync(guidelinesPath)) {
    console.error(`❌ Folder not found: ${guidelinesPath}`);
    return;
  }
  
  // Get all image files
  const files = getAllFiles(guidelinesPath);
  console.log(`📁 Found ${files.length} image files in ${guidelinesPath}\n`);
  
  if (files.length === 0) {
    console.error('❌ No image files found');
    return;
  }
  
  // Show the first few files
  console.log('📸 First 5 files found:');
  files.slice(0, 5).forEach((file, index) => {
    const fileName = path.basename(file);
    const fileSize = (fs.statSync(file).size / 1024).toFixed(2);
    console.log(`  ${index + 1}. ${fileName} (${fileSize} KB)`);
  });
  
  if (files.length > 5) {
    console.log(`  ... and ${files.length - 5} more files`);
  }
  
  console.log('\n📤 Manual Upload Instructions:');
  console.log('==============================');
  console.log('1. Go to: https://console.cloud.google.com/storage/browser/pikapika-cleaning-2025');
  console.log('2. Click "Upload files" or drag and drop');
  console.log('3. Upload all images from E:\\guidelines');
  console.log('4. Create folder structure: cleaning-guidelines/');
  console.log('5. Organize by room type if needed');
  
  console.log('\n🎯 Recommended GCS Structure:');
  console.log('cleaning-guidelines/');
  console.log('├── 1-1.png');
  console.log('├── 1-2.png');
  console.log('├── 1-3.png');
  console.log('├── 2-1.png');
  console.log('└── ... (all 24 images)');
  
  console.log('\n🔗 After upload, your images will be available at:');
  console.log('https://storage.googleapis.com/pikapika-cleaning-2025/cleaning-guidelines/');
  
  console.log('\n✅ Once uploaded, you can test the system functionality!');
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

prepareManualUpload();
