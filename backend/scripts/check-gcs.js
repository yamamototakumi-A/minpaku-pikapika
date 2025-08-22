require('dotenv').config();
const path = require('path');
const { Storage } = require('@google-cloud/storage');

async function main() {
  const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
  const bucketName = process.env.GOOGLE_CLOUD_BUCKET_NAME;
  const keyFile = process.env.GOOGLE_CLOUD_KEY_FILE || './service-account-key.json';

  if (!projectId || !bucketName) {
    console.error('Missing GOOGLE_CLOUD_PROJECT_ID or GOOGLE_CLOUD_BUCKET_NAME in environment.');
    process.exit(1);
  }

  const storage = new Storage({
    projectId,
    keyFilename: path.resolve(keyFile),
  });

  try {
    const bucket = storage.bucket(bucketName);
    const [files] = await bucket.getFiles({ autoPaginate: true });

    const imageExtensions = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.tif', '.tiff']);

    // Filter images by extension first (cheap). If unknown, we will include; adjust if needed.
    const imageFiles = files.filter(f => imageExtensions.has(path.extname(f.name).toLowerCase()));

    console.log(`Bucket: ${bucketName}`);
    console.log(`Total files: ${files.length}`);
    console.log(`Image files (by extension): ${imageFiles.length}`);

    if (imageFiles.length > 0) {
      const sample = imageFiles.slice(0, 24).map(f => f.name);
      console.log('Sample (up to 24):');
      sample.forEach((n, i) => console.log(`${i + 1}. ${n}`));
    }

    // Exit with code indicating whether there are exactly 24 images
    if (imageFiles.length === 24) {
      process.exit(0);
    } else {
      process.exit(2); // not exactly 24
    }
  } catch (err) {
    console.error('Failed to access GCS:', err.message);
    process.exit(1);
  }
}

main(); 