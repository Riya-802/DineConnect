import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

/**
 * Upload a buffer to Cloudinary using upload_stream wrapped in a Promise.
 * @param {Buffer} buffer - The file buffer to upload
 * @param {object} options - Cloudinary upload options (folder, public_id, etc.)
 * @returns {Promise<object>} Cloudinary upload result
 */
export const uploadBuffer = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const defaultOptions = {
      resource_type: 'image',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
      transformation: [{ quality: 'auto', fetch_format: 'auto' }],
      ...options,
    };

    const stream = cloudinary.uploader.upload_stream(
      defaultOptions,
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    stream.end(buffer);
  });
};

/**
 * Delete an image from Cloudinary by its public_id.
 * @param {string} publicId - The public_id of the image (e.g. "dineconnect/restaurants/abc123")
 * @returns {Promise<object>}
 */
export const deleteImage = async (publicId) => {
  if (!publicId) return null;
  const result = await cloudinary.uploader.destroy(publicId);
  return result;
};

/**
 * Generate an optimized/transformed URL for an existing Cloudinary asset.
 * @param {string} publicId
 * @param {object} options - Cloudinary transformation options
 * @returns {string} Signed/optimized URL
 */
export const getOptimizedUrl = (publicId, options = {}) => {
  const defaultOpts = {
    quality: 'auto',
    fetch_format: 'auto',
    ...options,
  };
  return cloudinary.url(publicId, defaultOpts);
};

export default cloudinary;
