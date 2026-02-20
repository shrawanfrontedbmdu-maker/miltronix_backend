import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import multer from 'multer';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadToCloud = (fileBuffer, folder) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      { folder: folder, resource_type: "image" },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    ).end(fileBuffer);
  });
};

// Custom Multer storage for Cloudinary
const cloudinaryStorage = (folder, resource_type = "image") => {
  return {
    _handleFile(req, file, cb) {
      const stream = cloudinary.uploader.upload_stream(
        { folder, resource_type, public_id: `${folder}-${Date.now()}` },
        (error, result) => {
          if (error) return cb(error);
          cb(null, {
            path: result.secure_url,
            filename: result.public_id,
          });
        }
      );
      streamifier.createReadStream(file.buffer).pipe(stream);
    },
    _removeFile(req, file, cb) {
      cloudinary.uploader.destroy(file.filename, { resource_type: "auto" }, cb);
    },
  };
};

export const uploadReviewMedia = multer({
  storage: cloudinaryStorage("review-media", "auto"),
});

export default cloudinary;
