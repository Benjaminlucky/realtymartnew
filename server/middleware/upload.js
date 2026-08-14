"use strict";

const multer = require("multer");
const { Readable } = require("stream");
const cloudinary = require("../config/cloudinary");
const { Setting } = require("../models/Misc");

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX = parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024;
const VALID_FOLDERS = ["lands", "houses", "blog", "general", "logos"];
const FOLDER_PREFIX = process.env.CLOUDINARY_FOLDER_PREFIX || "naijarealty";

// Folders that must never receive a watermark — site branding assets.
const WATERMARK_EXEMPT_FOLDERS = new Set(["logos"]);

const WATERMARK_KEYS = [
  "watermark_enabled",
  "watermark_text",
  "watermark_opacity",
  "watermark_color",
  "watermark_scale",
  "site_name",
];

/**
 * Builds a Cloudinary text-overlay transformation component for the
 * centered watermark, or null if watermarking is disabled/unconfigured.
 * Shared by the live upload path and the backfill script so both stay
 * in sync (server/scripts/backfill-watermark.js).
 */
async function getWatermarkTransformation() {
  const docs = await Setting.find({ key: { $in: WATERMARK_KEYS } }).lean();
  const map = docs.reduce((acc, s) => {
    acc[s.key] = s.value;
    return acc;
  }, {});

  if (map.watermark_enabled === "false") return null;

  const text = (map.watermark_text || map.site_name || "").trim();
  if (!text) return null;

  const opacity = Math.min(
    100,
    Math.max(1, parseInt(map.watermark_opacity, 10) || 35),
  );
  const scalePct = Math.min(
    100,
    Math.max(10, parseInt(map.watermark_scale, 10) || 60),
  );
  const color = /^#[0-9A-Fa-f]{3,8}$/.test(map.watermark_color || "")
    ? map.watermark_color
    : "#FFFFFF";

  return {
    overlay: {
      font_family: "Arial",
      font_size: 200,
      font_weight: "bold",
      text,
    },
    color,
    opacity,
    gravity: "center",
    flags: "relative",
    width: scalePct / 100,
    crop: "fit",
  };
}

function fileFilter(req, file, cb) {
  if (ALLOWED.has(file.mimetype)) return cb(null, true);
  const err = new Error("Only JPEG, PNG, WebP, and GIF images are allowed");
  err.status = 400;
  cb(err);
}

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: MAX },
});

/**
 * Uploads a single file buffer to Cloudinary.
 * Attaches result to req.cloudinaryResult and the resolved folder to req.uploadFolder.
 * Call after upload.single() or upload.array() in your route middleware chain.
 */
async function uploadToCloudinary(req, res, next) {
  // Support both single file (req.file) and multiple files (req.files)
  const files = req.file
    ? [req.file]
    : Array.isArray(req.files)
      ? req.files
      : [];

  if (!files.length) return next();

  const raw = req.body?.folder || req.query?.folder || "general";
  const folder = VALID_FOLDERS.includes(raw) ? raw : "general";
  req.uploadFolder = folder;

  const transformation = [{ quality: "auto", fetch_format: "auto" }];

  if (!WATERMARK_EXEMPT_FOLDERS.has(folder)) {
    let watermark = null;
    try {
      watermark = await getWatermarkTransformation();
    } catch {
      // If settings can't be read, fail open (upload without watermark)
      // rather than blocking the admin's upload.
      watermark = null;
    }
    if (watermark) transformation.push(watermark);
  }

  const uploadParams = {
    folder: `${FOLDER_PREFIX}/${folder}`,
    transformation,
  };

  const uploadOne = (file) =>
    new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        uploadParams,
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        },
      );
      Readable.from(file.buffer).pipe(stream);
    });

  Promise.all(files.map(uploadOne))
    .then((results) => {
      // Attach results the same way multer-storage-cloudinary did —
      // directly onto each file object so existing route code keeps working
      if (req.file) {
        req.file.path = results[0].secure_url;
        req.file.filename = results[0].public_id;
        req.cloudinaryResult = results[0];
      } else {
        req.files = req.files.map((file, i) => ({
          ...file,
          path: results[i].secure_url,
          filename: results[i].public_id,
        }));
        req.cloudinaryResults = results;
      }
      next();
    })
    .catch(next);
}

module.exports = {
  upload,
  uploadToCloudinary,
  getWatermarkTransformation,
  WATERMARK_EXEMPT_FOLDERS,
};
