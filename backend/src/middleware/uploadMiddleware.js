import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

// ── Configure Cloudinary ──────────────────────────────────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// ── Multer: store in memory so we can stream to Cloudinary ───────────────────
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpeg, png, webp, gif)'), false);
  }
};

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

/**
 * Multer middleware for a single file upload.
 * @param {string} fieldName - The form field name for the file
 * @returns {import('multer').RequestHandler}
 */
export const uploadSingle = (fieldName) =>
  multer({ storage, fileFilter, limits: { fileSize: MAX_SIZE } }).single(fieldName);

/**
 * Multer middleware for multiple file uploads.
 * @param {string} fieldName - The form field name for the files
 * @param {number} max       - Maximum number of files allowed
 * @returns {import('multer').RequestHandler}
 */
export const uploadMultiple = (fieldName, max = 5) =>
  multer({ storage, fileFilter, limits: { fileSize: MAX_SIZE } }).array(fieldName, max);

/**
 * Upload a buffer to Cloudinary.
 * @param {Buffer} buffer  - File buffer from multer memoryStorage
 * @param {string} folder  - Cloudinary folder path (e.g. 'dineconnect/restaurants')
 * @param {object} extras  - Additional Cloudinary upload options
 * @returns {Promise<{ url: string, publicId: string }>}
 */
export const uploadToCloudinary = (buffer, folder = 'dineconnect', extras = {}) => {
  return new Promise((resolve, reject) => {
    const options = {
      folder,
      resource_type: 'image',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
      transformation: [{ quality: 'auto', fetch_format: 'auto' }],
      ...extras,
    };

    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) return reject(error);
      resolve({ url: result.secure_url, publicId: result.public_id });
    });

    stream.end(buffer);
  });
};
