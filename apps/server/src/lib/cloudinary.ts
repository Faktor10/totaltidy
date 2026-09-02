import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export { cloudinary };

export const UPLOAD_FOLDER = "totaltidy";
export const UPLOAD_PRESET_NAME = "totaltidy_unsigned";
export const ALLOWED_FORMATS = ["jpg", "jpeg", "png", "webp", "heic"];
export const MAX_FILE_SIZE = 10_000_000;
