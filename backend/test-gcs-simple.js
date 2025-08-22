require('dotenv').config();
const { Storage } = require('@google-cloud/storage');

async function testGCS() {
  try {
    console.log('Testing GCS connection...');
    console.log('Project ID:', process.env.GOOGLE_CLOUD_PROJECT_ID);
    console.log('Bucket Name:', process.env.GOOGLE_CLOUD_BUCKET_NAME);
    console.log('Key File:', process.env.GOOGLE_CLOUD_KEY_FILE);

    const storage = new Storage({
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
      keyFilename: process.env.GOOGLE_CLOUD_KEY_FILE,
    });

    const bucket = storage.bucket(process.env.GOOGLE_CLOUD_BUCKET_NAME);
    
    // Test if we can access the bucket
    const [exists] = await bucket.exists();
    console.log('Bucket exists:', exists);
    
    if (exists) {
      const [files] = await bucket.getFiles({ maxResults: 5 });
      console.log('Files in bucket:', files.length);
      files.forEach(file => console.log('-', file.name));
    }

    console.log('✅ GCS connection successful!');
  } catch (error) {
    console.error('❌ GCS connection failed:', error.message);
    console.error('Full error:', error);
  }
}

testGCS();
