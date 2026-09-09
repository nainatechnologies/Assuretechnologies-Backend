const cloudinary = require('cloudinary').v2;

/**
 * Extracts the public_id from a Cloudinary URL.
 * @param {string} url - The Cloudinary URL
 * @returns {string|null} - The extracted public_id or null if invalid
 */
const extractPublicId = (url) => {
  if (!url || !url.includes('cloudinary.com')) return null;
  
  try {
    const parts = url.split('/');
    const uploadIndex = parts.indexOf('upload');
    if (uploadIndex === -1) return null;
    
    // The path parts after the version string (which starts with 'v')
    // e.g. .../upload/v123456789/folder/filename.jpg
    let startIndex = uploadIndex + 1;
    if (parts[startIndex].startsWith('v') && !isNaN(parts[startIndex].substring(1))) {
      startIndex += 1;
    }
    
    const pathParts = parts.slice(startIndex);
    const fileWithExt = pathParts.join('/');
    
    // Remove the extension
    const lastDotIndex = fileWithExt.lastIndexOf('.');
    if (lastDotIndex !== -1) {
      return fileWithExt.substring(0, lastDotIndex);
    }
    return fileWithExt;
  } catch (error) {
    console.error('Error extracting public_id from Cloudinary URL:', error);
    return null;
  }
};

/**
 * Deletes a file from Cloudinary given its URL.
 * @param {string} url - The Cloudinary URL
 */
const deleteFromCloudinary = async (url) => {
  const publicId = extractPublicId(url);
  if (publicId) {
    try {
      await cloudinary.uploader.destroy(publicId);
      console.log(`Successfully deleted from Cloudinary: ${publicId}`);
    } catch (error) {
      console.error(`Failed to delete from Cloudinary (${publicId}):`, error);
    }
  }
};

/**
 * Uploads a PDF Buffer to Cloudinary using a stream.
 * @param {Buffer} buffer - The PDF buffer
 * @param {string} publicId - Optional public ID
 * @returns {Promise<string>} - The secure URL of the uploaded PDF
 */
const uploadPdfStreamToCloudinary = (buffer, publicId) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'raw',
        format: 'pdf',
        public_id: publicId,
        folder: 'invoices',
      },
      (error, result) => {
        if (error) {
          console.error('Error uploading PDF to Cloudinary:', error);
          return reject(error);
        }
        resolve(result.secure_url);
      }
    );
    uploadStream.end(buffer);
  });
};

module.exports = {
  extractPublicId,
  deleteFromCloudinary,
  uploadPdfStreamToCloudinary
};
