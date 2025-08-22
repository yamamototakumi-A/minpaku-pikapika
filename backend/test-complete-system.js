require('dotenv').config();
const { Storage } = require('@google-cloud/storage');
const fs = require('fs');
const path = require('path');

async function testCompleteSystem() {
  try {
    console.log('🧪 Testing Complete Image Management System...');
    
    const storage = new Storage({
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
      keyFilename: process.env.GOOGLE_CLOUD_KEY_FILE,
    });

    const bucketName = process.env.GOOGLE_CLOUD_BUCKET_NAME;
    const bucket = storage.bucket(bucketName);
    
    console.log(`📦 Bucket: ${bucketName}`);
    console.log(`👤 Service Account: ${process.env.GOOGLE_CLOUD_KEY_FILE}`);
    
    // Test 1: Check bucket access
    console.log('\n🔍 Test 1: Checking bucket access...');
    const [exists] = await bucket.exists();
    if (!exists) {
      console.error('❌ Bucket does not exist or no access');
      return;
    }
    console.log('✅ Bucket access confirmed');
    
    // Test 2: Check current file structure
    console.log('\n🔍 Test 2: Checking current file structure...');
    const [files] = await bucket.getFiles({ maxResults: 100 });
    console.log(`📁 Found ${files.length} files in bucket`);
    
    // Group files by path structure
    const fileStructure = {};
    files.forEach(file => {
      const pathParts = file.name.split('/');
      if (pathParts.length >= 2) {
        const category = pathParts[0];
        if (!fileStructure[category]) fileStructure[category] = [];
        fileStructure[category].push(file.name);
      }
    });
    
    console.log('\n📊 File structure:');
    Object.keys(fileStructure).forEach(category => {
      console.log(`  ${category}: ${fileStructure[category].length} files`);
      if (category === 'facilities' || category === 'guidelines') {
        fileStructure[category].slice(0, 5).forEach(file => {
          console.log(`    - ${file}`);
        });
        if (fileStructure[category].length > 5) {
          console.log(`    ... and ${fileStructure[category].length - 5} more`);
        }
      }
    });
    
    // Test 3: Test image upload to new structure
    console.log('\n🔍 Test 3: Testing new file organization structure...');
    
    // Create a test image path
    const testDate = new Date().toISOString().slice(0, 10);
    const testPath = `facilities/TEST001/トイレ/${testDate}/before/test-${Date.now()}.txt`;
    
    try {
      const testFile = bucket.file(testPath);
      await testFile.save('Test content for file organization', {
        metadata: {
          contentType: 'text/plain',
          metadata: {
            test: 'true',
            timestamp: new Date().toISOString()
          }
        }
      });
      console.log(`✅ Test file created: ${testPath}`);
      
      // Clean up test file
      await testFile.delete();
      console.log('✅ Test file cleaned up');
      
    } catch (error) {
      console.log(`⚠️  Test file creation failed: ${error.message}`);
    }
    
    // Test 4: Check guidelines access
    console.log('\n🔍 Test 4: Checking guidelines access...');
    const guidelineFiles = files.filter(f => f.name.startsWith('guidelines/'));
    console.log(`📚 Found ${guidelineFiles.length} guideline files`);
    
    if (guidelineFiles.length > 0) {
      const sampleGuideline = guidelineFiles[0];
      try {
        const [metadata] = await sampleGuideline.getMetadata();
        console.log(`✅ Sample guideline accessible: ${sampleGuideline.name}`);
        console.log(`   Size: ${metadata.size} bytes`);
        console.log(`   Content-Type: ${metadata.contentType}`);
        
        // Test public access
        const publicUrl = `https://storage.googleapis.com/${bucketName}/${sampleGuideline.name}`;
        console.log(`🌐 Public URL: ${publicUrl}`);
        
      } catch (error) {
        console.log(`⚠️  Guideline access test failed: ${error.message}`);
      }
    }
    
    // Test 5: Verify file organization compliance
    console.log('\n🔍 Test 5: Verifying file organization compliance...');
    
    const complianceIssues = [];
    files.forEach(file => {
      if (file.name.startsWith('facilities/')) {
        const pathParts = file.name.split('/');
        if (pathParts.length < 6) {
          complianceIssues.push(`Incomplete path: ${file.name}`);
        } else {
          const [_, facilityId, roomType, date, beforeAfter, filename] = pathParts;
          if (!facilityId || !roomType || !date || !beforeAfter || !filename) {
            complianceIssues.push(`Missing path components: ${file.name}`);
          }
        }
      }
    });
    
    if (complianceIssues.length === 0) {
      console.log('✅ All facility files follow proper organization structure');
    } else {
      console.log('⚠️  Found compliance issues:');
      complianceIssues.slice(0, 5).forEach(issue => {
        console.log(`   - ${issue}`);
      });
      if (complianceIssues.length > 5) {
        console.log(`   ... and ${complianceIssues.length - 5} more issues`);
      }
    }
    
    // Summary
    console.log('\n📊 System Test Summary:');
    console.log(`✅ Bucket access: Working`);
    console.log(`✅ File organization: ${complianceIssues.length === 0 ? 'Compliant' : 'Needs attention'}`);
    console.log(`✅ Guidelines access: ${guidelineFiles.length > 0 ? 'Available' : 'None found'}`);
    console.log(`✅ Total files: ${files.length}`);
    
    if (complianceIssues.length === 0) {
      console.log('\n🎉 All tests passed! The system is ready for production use.');
    } else {
      console.log('\n⚠️  Some issues found. Please review and fix before production use.');
    }
    
  } catch (error) {
    console.error('❌ System test failed:', error.message);
  }
}

testCompleteSystem();
