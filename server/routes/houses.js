"use strict";

const router = require("express").Router();
const {
  ok,
  created,
  fail,
  paginated,
  parsePagination,
} = require("../lib/helpers");
const { requireAuth } = require("../middleware/auth");
const { upload } = require("../middleware/upload");
const House = require("../models/House");
const { revalidate } = require("../lib/revalidate");

function housePaths(slug) {
  const base = ["/", "/houses"];
  return slug ? [...base, `/houses/${slug}`] : base;
}

// ══════════════════════════════════════════════════════════════════
// PUBLIC ROUTES
// ══════════════════════════════════════════════════════════════════

// GET /houses
router.get("/", async (req, res, next) => {
  try {
    const { page, perPage, skip } = parsePagination(req.query);
    const {
      location,
      state,
      status,
      category,
      bedrooms,
      min_price,
      max_price,
      search,
      featured,
    } = req.query;

    const filter = {};
    if (location) filter.location = { $regex: location, $options: "i" };
    if (state) filter.state = { $regex: state, $options: "i" };
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (bedrooms !== undefined) filter.bedrooms = Number(bedrooms);
    if (featured === "true") filter.featured = true;
    if (min_price || max_price) {
      filter.price = {};
      if (min_price) filter.price.$gte = Number(min_price);
      if (max_price) filter.price.$lte = Number(max_price);
    }
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { location: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const [data, total] = await Promise.all([
      House.find(filter)
        .sort({ featured: -1, createdAt: -1 })
        .skip(skip)
        .limit(perPage)
        .lean(),
      House.countDocuments(filter),
    ]);
    return paginated(res, { data, total, page, perPage });
  } catch (err) {
    next(err);
  }
});

// GET /houses/featured
router.get("/featured", async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 6, 12);
    const data = await House.find({ featured: true, status: { $ne: "sold" } })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    return ok(res, data);
  } catch (err) {
    next(err);
  }
});

// GET /houses/:slug — public detail + increment views
router.get("/:slug", async (req, res, next) => {
  try {
    const house = await House.findOneAndUpdate(
      { slug: req.params.slug },
      { $inc: { views_count: 1 } },
      { new: true },
    ).lean();
    if (!house) return fail(res, "House listing not found", 404);
    return ok(res, house);
  } catch (err) {
    next(err);
  }
});

// ══════════════════════════════════════════════════════════════════
// ADMIN ROUTES
// ══════════════════════════════════════════════════════════════════

// GET /admin/houses
router.get("/admin/houses", requireAuth, async (req, res, next) => {
  try {
    const { page, perPage, skip } = parsePagination(req.query);
    const { status, search } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { location: { $regex: search, $options: "i" } },
      ];
    }
    const [data, total] = await Promise.all([
      House.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(perPage)
        .lean(),
      House.countDocuments(filter),
    ]);
    return paginated(res, { data, total, page, perPage });
  } catch (err) {
    next(err);
  }
});

// POST /admin/houses — create
router.post(
  "/admin/houses",
  requireAuth,
  upload.array("images", 10),
  async (req, res, next) => {
    try {
      const body = { ...req.body };

      for (const f of ["features", "gallery", "tags"]) {
        if (typeof body[f] === "string") {
          try {
            body[f] = JSON.parse(body[f]);
          } catch {
            delete body[f];
          }
        }
      }
      if (body.featured !== undefined)
        body.featured = body.featured === "true" || body.featured === true;
      if (body.price) body.price = Number(body.price);
      if (body.bedrooms !== undefined) body.bedrooms = Number(body.bedrooms);
      if (body.bathrooms !== undefined) body.bathrooms = Number(body.bathrooms);
      if (body.garage !== undefined) body.garage = Number(body.garage);
      if (body.size_sqm !== undefined) body.size_sqm = Number(body.size_sqm);
      if (body.latitude) body.latitude = Number(body.latitude);
      if (body.longitude) body.longitude = Number(body.longitude);

      if (req.files?.length) {
        body.feature_image = req.files[0].path || req.files[0].secure_url;
        body.gallery = req.files.map((f) => f.path || f.secure_url);
      }

      if (!body.title) return fail(res, "Title is required");
      if (!body.slug)
        body.slug = body.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "");

      const house = await House.create(body);

      // ── Revalidate public pages ──────────────────────────────────
      revalidate(housePaths(house.slug));

      return created(res, house, "House listing created");
    } catch (err) {
      next(err);
    }
  },
);

// PUT /admin/houses/:id — update
router.put(
  "/admin/houses/:id",
  requireAuth,
  upload.array("images", 10),
  async (req, res, next) => {
    try {
      const body = { ...req.body };

      for (const f of ["features", "gallery", "tags"]) {
        if (typeof body[f] === "string") {
          try {
            body[f] = JSON.parse(body[f]);
          } catch {
            delete body[f];
          }
        }
      }
      if (body.featured !== undefined)
        body.featured = body.featured === "true" || body.featured === true;
      if (body.price) body.price = Number(body.price);
      if (body.bedrooms !== undefined) body.bedrooms = Number(body.bedrooms);
      if (body.bathrooms !== undefined) body.bathrooms = Number(body.bathrooms);
      if (body.garage !== undefined) body.garage = Number(body.garage);
      if (body.size_sqm !== undefined) body.size_sqm = Number(body.size_sqm);
      if (body.latitude) body.latitude = Number(body.latitude);
      if (body.longitude) body.longitude = Number(body.longitude);

      if (req.files?.length) {
        body.feature_image = req.files[0].path || req.files[0].secure_url;
        body.gallery = req.files.map((f) => f.path || f.secure_url);
      }

      const house = await House.findByIdAndUpdate(req.params.id, body, {
        new: true,
        runValidators: true,
      }).lean();
      if (!house) return fail(res, "House listing not found", 404);

      // ── Revalidate public pages ──────────────────────────────────
      revalidate(housePaths(house.slug));

      return ok(res, house, "House listing updated");
    } catch (err) {
      next(err);
    }
  },
);

// DELETE /admin/houses/:id
router.delete("/admin/houses/:id", requireAuth, async (req, res, next) => {
  try {
    const house = await House.findByIdAndDelete(req.params.id);
    if (!house) return fail(res, "House listing not found", 404);

    // ── Revalidate public pages ──────────────────────────────────
    revalidate(housePaths(house.slug));

    return ok(res, null, "House listing deleted");
  } catch (err) {
    next(err);
  }
});

module.exports = router;
