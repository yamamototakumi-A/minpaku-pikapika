require('dotenv').config();
const { Storage } = require('@google-cloud/storage');
const https = require('https');

async function testImageAccess() {
  console.log('🧪 Testing guideline image access from web application...');
  
  const testImages = [
    'https://storage.googleapis.com/pikapika-cleaning-2025/guidelines/1-1.png',
    'https://storage.googleapis.com/pikapika-cleaning-2025/guidelines/2-1.png',
    'https://storage.googleapis.com/pikapika-cleaning-2025/guidelines/5-1.png'
  ];

  for (const imageUrl of testImages) {
    try {
      console.log(`🔍 Testing: ${imageUrl}`);
      
      const result = await new Promise((resolve, reject) => {
        https.get(imageUrl, (res) => {
          console.log(`✅ Status: ${res.statusCode}`);
          console.log(`   Content-Type: ${res.headers['content-type']}`);
          console.log(`   Content-Length: ${res.headers['content-length']} bytes`);
          
          if (res.statusCode === 200) {
            resolve(true);
          } else {
            reject(new Error(`HTTP ${res.statusCode}`));
          }
        }).on('error', (err) => {
          reject(err);
        });
      });
      
    } catch (error) {
      console.error(`❌ Failed: ${error.message}`);
    }
    console.log('---');
  }
  
  console.log('🎯 Test complete! If all images show status 200, they should work in your dashboard.');
}

testImageAccess();
