const { Storage } = require('@google-cloud/storage');
require('dotenv').config();

// Initialize Google Cloud Storage
const storage = new Storage({
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
  credentials: {
    client_email: process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_CLOUD_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }
});

const bucketName = process.env.GOOGLE_CLOUD_BUCKET_NAME || 'pikapika-cleaning-2025';
const bucket = storage.bucket(bucketName);

// Make all images in guidelines folder public
const makeImagesPublic = async () => {
  try {
    console.log('🔓 Making images publicly accessible...');
    console.log(`📦 Bucket: ${bucketName}`);
    
    // List all files in the guidelines folder
    const [files] = await bucket.getFiles({ prefix: 'guidelines/' });
    
    if (files.length === 0) {
      console.log('❌ No files found in guidelines/ folder');
      return;
    }

    console.log(`📸 Found ${files.length} files to make public`);

    // Make each file public
    for (const file of files) {
      try {
        await file.makePublic();
        console.log(`✅ Made public: ${file.name}`);
      } catch (error) {
        console.error(`❌ Error making ${file.name} public:`, error.message);
      }
    }

    console.log('\n🎉 All images are now publicly accessible!');
    console.log('\n📋 You can now access images at:');
    files.forEach(file => {
      console.log(`   https://storage.googleapis.com/${bucketName}/${file.name}`);
    });

  } catch (error) {
    console.error('❌ Error making images public:', error);
  }
};

// Run the script
if (require.main === module) {
  makeImagesPublic();
}

module.exports = { makeImagesPublic };
