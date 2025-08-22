const { Storage } = require('@google-cloud/storage');

// Initialize Google Cloud Storage
const storage = new Storage({
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
  keyFilename: process.env.GOOGLE_CLOUD_KEY_FILE,
});

const bucketName = process.env.GOOGLE_CLOUD_BUCKET_NAME;
const bucket = storage.bucket(bucketName);

// Upload image to Google Cloud Storage and return metadata for DB
// Supports both legacy Multer file objects and new buffer + metadata pattern
const uploadImage = async (fileOrBuffer, folder = 'images', contentType = 'image/jpeg', meta = {}) => {
  try {
    let buffer, fileName, mimeType;
    
    // Handle both legacy Multer file objects and new buffer pattern
    if (fileOrBuffer.buffer && fileOrBuffer.originalname && fileOrBuffer.mimetype) {
      // Legacy Multer file object
      buffer = fileOrBuffer.buffer;
      fileName = `${folder}/${Date.now()}-${fileOrBuffer.originalname}`;
      mimeType = fileOrBuffer.mimetype;
    } else if (Buffer.isBuffer(fileOrBuffer) || fileOrBuffer instanceof ArrayBuffer || ArrayBuffer.isView(fileOrBuffer)) {
      // New buffer pattern - handle ArrayBuffer, Buffer, and TypedArrays
      if (Buffer.isBuffer(fileOrBuffer)) {
        buffer = fileOrBuffer;
      } else if (fileOrBuffer instanceof ArrayBuffer) {
        buffer = Buffer.from(fileOrBuffer);
      } else if (ArrayBuffer.isView(fileOrBuffer)) {
        // Handle TypedArrays (Uint8Array, etc.)
        buffer = Buffer.from(fileOrBuffer.buffer, fileOrBuffer.byteOffset, fileOrBuffer.byteLength);
      } else {
        buffer = Buffer.from(fileOrBuffer);
      }
      fileName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${contentType.split('/')[1] || 'bin'}`;
      mimeType = contentType;
    } else {
      throw new Error('Invalid file format: expected Multer file object or Buffer/ArrayBuffer');
    }
    
    const blob = bucket.file(fileName);
    const blobStream = blob.createWriteStream({
      metadata: { contentType: mimeType },
      resumable: false,
    });
    
    return new Promise((resolve, reject) => {
      blobStream.on('error', (error) => reject(error));
      blobStream.on('finish', async () => {
        // Make the file publicly accessible for direct URL access
        try {
          await blob.makePublic();
        } catch (makePublicError) {
          console.warn('Could not make file public:', makePublicError.message);
        }
        
        const publicUrl = `https://storage.googleapis.com/${bucketName}/${fileName}`;
        
        // Return appropriate format based on calling pattern
        if (fileOrBuffer.buffer && fileOrBuffer.originalname) {
          // Legacy format
          resolve({
            gcs_url: publicUrl,
            ...meta,
            uploaded_at: new Date(),
            updated_at: new Date(),
          });
        } else {
          // New format - just return the URL
          resolve(publicUrl);
        }
      });
      blobStream.end(buffer);
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

// Delete image from Google Cloud Storage
const deleteImage = async (imageUrlOrPath) => {
  try {
    const fileName = extractFilePath(imageUrlOrPath);
    if (fileName) {
      await bucket.file(fileName).delete({ ignoreNotFound: true });
      console.log(`Image deleted: ${fileName}`);
    }
  } catch (error) {
    console.error('Error deleting image:', error);
    throw error;
  }
};

// v4 signed URL for READ (download/display)
const getSignedReadUrl = async (filePath, expirationMinutes = 15) => {
  try {
    const options = {
      version: 'v4',
      action: 'read',
      expires: Date.now() + expirationMinutes * 60 * 1000,
    };
    const [url] = await bucket.file(filePath).getSignedUrl(options);
    return url;
  } catch (error) {
    console.error('Error generating signed READ URL:', error);
    throw error;
  }
};

// v4 signed URL for WRITE (direct browser upload via PUT)
const getSignedUploadUrl = async (filePath, contentType, expirationMinutes = 15) => {
  try {
    const options = {
      version: 'v4',
      action: 'write',
      expires: Date.now() + expirationMinutes * 60 * 1000,
      contentType,
    };
    const [url] = await bucket.file(filePath).getSignedUrl(options);
    return url;
  } catch (error) {
    console.error('Error generating signed UPLOAD URL:', error);
    throw error;
  }
};

// Utilities
const extractFilePath = (imageUrlOrPath) => {
  if (!imageUrlOrPath) return null;
  // If already a path (contains no bucket host), return as is
  if (!imageUrlOrPath.includes('storage.googleapis.com')) return imageUrlOrPath.replace(/^\//, '');
  const idx = imageUrlOrPath.indexOf(`${bucketName}/`);
  if (idx === -1) return null;
  return imageUrlOrPath.slice(idx + bucketName.length + 1);
};

const toGcsUrl = (filePath) => `https://storage.googleapis.com/${bucketName}/${filePath}`;

module.exports = {
  uploadImage,
  deleteImage,
  getSignedReadUrl,
  getSignedUploadUrl,
  extractFilePath,
  toGcsUrl,
  bucket,
};
