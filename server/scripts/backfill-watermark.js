/**
 * server/scripts/backfill-watermark.js
 * ─────────────────────────────────────────────────────────────────
 * One-time script to apply the centered text watermark (configured in
 * Admin Settings → Image Watermark) to House/Land/Blog images that
 * were already uploaded to Cloudinary before watermarking existed.
 *
 * Non-destructive: it does NOT re-upload or overwrite the original
 * stored asset. It derives a new Cloudinary delivery URL (the same
 * public_id + a watermark transformation), and only that derived URL
 * is written to MongoDB. Cloudinary generates and caches the derived
 * image lazily on first request — no extra upload call needed. The
 * original raw file stays exactly as it was, reachable at its old URL.
 *
 * Usage (run from inside server/):
 *   node scripts/backfill-watermark.js              # dry run — prints planned changes, writes nothing
 *   node scripts/backfill-watermark.js --commit     # writes a JSON backup, then updates MongoDB
 *
 * Safe to re-run — URLs that already carry the watermark transformation
 * (contain "l_text:") are left untouched.
 */

"use strict";

require("dotenv").config();

const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const House = require("../models/House");
const Land = require("../models/Land");
const { BlogPost } = require("../models/Blog");
const { getWatermarkTransformation } = require("../middleware/upload");

const COMMIT = process.argv.includes("--commit");
const BACKUP_DIR = path.join(__dirname, "backups");

// ── Helpers ───────────────────────────────────────────────────────

function isCloudinaryUrl(url) {
  return typeof url === "string" && url.includes("res.cloudinary.com");
}

function alreadyWatermarked(url) {
  return typeof url === "string" && url.includes("/l_text:");
}

/** Pulls the public_id (folder path + id, no extension) out of a Cloudinary secure_url */
function extractPublicId(url) {
  const match = url.match(/\/upload\/(?:.+?\/)?v\d+\/(.+)\.[a-zA-Z0-9]{2,5}(?:\?.*)?$/);
  return match ? match[1] : null;
}

/** Returns the watermarked delivery URL for a given image URL, or null if it can't/shouldn't be changed */
function buildWatermarkedUrl(url, transformation) {
  if (!isCloudinaryUrl(url) || alreadyWatermarked(url)) return null;
  const publicId = extractPublicId(url);
  if (!publicId) return null;
  return cloudinary.url(publicId, {
    transformation: [{ quality: "auto", fetch_format: "auto" }, transformation],
    secure: true,
  });
}

// ── Per-collection processing ────────────────────────────────────

async function planForModel(Model, label, fields) {
  const docs = await Model.find({});
  const changes = [];

  for (const doc of docs) {
    for (const field of fields) {
      const value = doc[field];

      if (Array.isArray(value)) {
        const newArr = value.map((url, i) => {
          const watermarked = buildWatermarkedUrl(url, global.__wmTransform);
          if (watermarked) {
            changes.push({
              model: label,
              id: String(doc._id),
              name: doc.title || doc.estate_name || doc.slug || String(doc._id),
              field,
              index: i,
              oldValue: url,
              newValue: watermarked,
            });
          }
          return watermarked || url;
        });
        if (changes.some((c) => c.model === label && c.id === String(doc._id) && c.field === field)) {
          doc.$__wmPending = doc.$__wmPending || {};
          doc.$__wmPending[field] = newArr;
        }
      } else if (typeof value === "string" && value) {
        const watermarked = buildWatermarkedUrl(value, global.__wmTransform);
        if (watermarked) {
          changes.push({
            model: label,
            id: String(doc._id),
            name: doc.title || doc.estate_name || doc.slug || String(doc._id),
            field,
            oldValue: value,
            newValue: watermarked,
          });
          doc.$__wmPending = doc.$__wmPending || {};
          doc.$__wmPending[field] = watermarked;
        }
      }
    }
  }

  return { docs, changes };
}

async function applyPending(docs) {
  let saved = 0;
  for (const doc of docs) {
    if (doc.$__wmPending) {
      for (const [field, value] of Object.entries(doc.$__wmPending)) {
        doc[field] = value;
      }
      await doc.save();
      saved++;
    }
  }
  return saved;
}

// ── Main ──────────────────────────────────────────────────────────

async function main() {
  console.log(`🚀 Watermark backfill — ${COMMIT ? "COMMIT" : "DRY RUN"} mode`);

  await mongoose.connect(process.env.MONGODB_URI, {
    dbName: process.env.DB_NAME || "naijarealty",
  });
  console.log("✓ MongoDB connected");

  const transformation = await getWatermarkTransformation();
  if (!transformation) {
    console.log(
      "\n⚠ Watermarking is currently disabled or has no text configured " +
        "(Admin Settings → Image Watermark). Enable it first, then re-run this script.",
    );
    await mongoose.disconnect();
    process.exit(0);
  }
  global.__wmTransform = transformation;

  const targets = [
    { Model: House, label: "House", fields: ["feature_image", "gallery"] },
    { Model: Land, label: "Land", fields: ["feature_image", "gallery"] },
    { Model: BlogPost, label: "BlogPost", fields: ["cover_image"] },
  ];

  const allChanges = [];
  const allDocs = [];

  for (const { Model, label, fields } of targets) {
    const { docs, changes } = await planForModel(Model, label, fields);
    console.log(`\n${label}: ${changes.length} image field(s) to watermark`);
    for (const c of changes) {
      console.log(`  • ${c.name} [${c.field}${c.index != null ? `[${c.index}]` : ""}]`);
    }
    allChanges.push(...changes);
    allDocs.push(...docs);
  }

  console.log(`\n── Total: ${allChanges.length} image field(s) across all collections ──`);

  if (!allChanges.length) {
    console.log("Nothing to do.");
    await mongoose.disconnect();
    process.exit(0);
  }

  if (!COMMIT) {
    console.log(
      "\nDry run only — no changes written. Re-run with --commit to apply.",
    );
    await mongoose.disconnect();
    process.exit(0);
  }

  // ── Commit: write backup first, then save ──────────────────────
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  const backupFile = path.join(
    BACKUP_DIR,
    `watermark-backfill-${Date.now()}.json`,
  );
  fs.writeFileSync(backupFile, JSON.stringify(allChanges, null, 2));
  console.log(`\n✓ Backup written: ${backupFile}`);

  const saved = await applyPending(allDocs);
  console.log(`✅ Updated ${saved} document(s).`);

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error("Backfill failed:", err);
  process.exit(1);
});
