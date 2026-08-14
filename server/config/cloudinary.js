"use strict";

const cloudinary = require("cloudinary").v2;

const REQUIRED = ["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"];
const missing = REQUIRED.filter((key) => !process.env[key]);
if (missing.length) {
  console.error(
    `[Cloudinary] Missing required env var(s): ${missing.join(", ")}. ` +
      "Image uploads will fail until these are set.",
  );
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

module.exports = cloudinary;
