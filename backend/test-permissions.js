require('dotenv').config();
const { Storage } = require('@google-cloud/storage');

async function testPermissions() {
  try {
    console.log('🔍 Testing Service Account Permissions...');
    
    const storage = new Storage({
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
      keyFilename: process.env.GOOGLE_CLOUD_KEY_FILE,
    });

    const bucketName = process.env.GOOGLE_CLOUD_BUCKET_NAME;
    console.log(`📦 Bucket: ${bucketName}`);
    console.log(`👤 Service Account: ${process.env.GOOGLE_CLOUD_KEY_FILE}`);
    
    // Test 1: Try to get bucket info
    console.log('\n🔍 Test 1: Checking bucket info access...');
    try {
      const bucket = storage.bucket(bucketName);
      const [metadata] = await bucket.getMetadata();
      console.log('✅ SUCCESS: Can get bucket metadata');
      console.log(`   Name: ${metadata.name}`);
      console.log(`   Location: ${metadata.location}`);
      console.log(`   Created: ${metadata.timeCreated}`);
    } catch (error) {
      console.log('❌ FAILED: Cannot get bucket metadata');
      console.log(`   Error: ${error.message}`);
    }
    
    // Test 2: Try to list files
    console.log('\n🔍 Test 2: Checking file listing access...');
    try {
      const bucket = storage.bucket(bucketName);
      const [files] = await bucket.getFiles({ maxResults: 5 });
      console.log('✅ SUCCESS: Can list files');
      console.log(`   Found ${files.length} files`);
      files.slice(0, 3).forEach(file => {
        console.log(`   - ${file.name}`);
      });
    } catch (error) {
      console.log('❌ FAILED: Cannot list files');
      console.log(`   Error: ${error.message}`);
    }
    
    // Test 3: Try to upload a test file
    console.log('\n🔍 Test 3: Checking upload access...');
    try {
      const bucket = storage.bucket(bucketName);
      const testFileName = `test-permissions-${Date.now()}.txt`;
      const file = bucket.file(testFileName);
      
      await file.save('Test content for permissions check', {
        metadata: {
          contentType: 'text/plain',
          metadata: {
            test: 'true',
            timestamp: new Date().toISOString()
          }
        }
      });
      console.log('✅ SUCCESS: Can upload files');
      console.log(`   Test file created: ${testFileName}`);
      
      // Clean up test file
      await file.delete();
      console.log('✅ SUCCESS: Can delete files');
      console.log(`   Test file cleaned up`);
      
    } catch (error) {
      console.log('❌ FAILED: Cannot upload/delete files');
      console.log(`   Error: ${error.message}`);
    }
    
    // Test 4: Try to access existing files
    console.log('\n🔍 Test 4: Checking file access...');
    try {
      const bucket = storage.bucket(bucketName);
      const testFile = bucket.file('guidelines/1-1.png');
      const [exists] = await testFile.exists();
      
      if (exists) {
        console.log('✅ SUCCESS: Can check if files exist');
        const [metadata] = await testFile.getMetadata();
        console.log('✅ SUCCESS: Can get file metadata');
        console.log(`   File: guidelines/1-1.png`);
        console.log(`   Size: ${metadata.size} bytes`);
      } else {
        console.log('⚠️  File guidelines/1-1.png does not exist');
      }
    } catch (error) {
      console.log('❌ FAILED: Cannot access files');
      console.log(`   Error: ${error.message}`);
    }
    
    console.log('\n📊 Permission Summary:');
    console.log('The service account needs these permissions:');
    console.log('✅ storage.objects.create (for uploads)');
    console.log('✅ storage.objects.delete (for deletions)');
    console.log('✅ storage.objects.get (for file access)');
    console.log('⚠️  storage.buckets.get (for bucket info)');
    console.log('⚠️  storage.objects.list (for file listing)');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testPermissions();
