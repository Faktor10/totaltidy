/**
 * Creates (or updates) the unsigned upload preset for TotalTidy in Cloudinary.
 *
 * Prerequisites: set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY,
 *                and CLOUDINARY_API_SECRET in your environment.
 *
 * Run:  npm run cloudinary:setup
 */

import "dotenv/config";
import { v2 as cloudinary } from "cloudinary";

const PRESET_NAME = "totaltidy_unsigned";
const UPLOAD_FOLDER = "totaltidy";
const ALLOWED_FORMATS = "jpg,jpeg,png,webp,heic";
const MAX_FILE_SIZE = 10_000_000;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const presetOptions = {
  unsigned: true,
  folder: UPLOAD_FOLDER,
  allowed_formats: ALLOWED_FORMATS,
  max_file_size: MAX_FILE_SIZE,
  transformation: "q_auto,f_auto",
  tags: "totaltidy",
};

async function setup() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  if (!cloudName) {
    console.error("Error: CLOUDINARY_CLOUD_NAME is not set.");
    process.exit(1);
  }

  try {
    await cloudinary.api.upload_preset(PRESET_NAME);
    await cloudinary.api.update_upload_preset(PRESET_NAME, presetOptions);
    console.log(`Updated existing upload preset "${PRESET_NAME}".`);
  } catch (error: unknown) {
    const status = (error as { http_code?: number })?.http_code;
    if (status === 404) {
      await cloudinary.api.create_upload_preset({
        name: PRESET_NAME,
        ...presetOptions,
      });
      console.log(`Created upload preset "${PRESET_NAME}".`);
    } else {
      throw error;
    }
  }

  console.log(`  Folder:          ${UPLOAD_FOLDER}/`);
  console.log(`  Allowed formats: ${ALLOWED_FORMATS}`);
  console.log(`  Max file size:   ${MAX_FILE_SIZE / 1_000_000} MB`);
  console.log(`  Mode:            unsigned`);
  console.log();
  console.log(`Set VITE_CLOUDINARY_UPLOAD_PRESET="${PRESET_NAME}" in your .env`);
}

setup().catch((error) => {
  console.error("Failed to setup Cloudinary preset:", error);
  process.exit(1);
});
