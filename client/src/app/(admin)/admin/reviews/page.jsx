"use client";

import { useState, useEffect, useCallback } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { reviewsApi } from "@/lib/api";
import { toast } from "sonner";
import {
  Plus,
  Star,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  X,
  Loader2,
  RefreshCw,
  AlertCircle,
  Search,
} from "lucide-react";

// ── Style helpers matching the existing admin aesthetic ───────────
const S = {
  page: {
    padding: "2rem",
    maxWidth: "1100px",
    fontFamily: "Inter, sans-serif",
  },
  label: {
    display: "block",
    fontSize: "0.75rem",
    fontWeight: 600,
    marginBottom: "0.375rem",
    color: "var(--color-text-secondary, #754a4f)",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    fontFamily: "Plus Jakarta Sans, sans-serif",
  },
  input: {
    width: "100%",
    padding: "0.625rem 0.875rem",
    borderRadius: "var(--radius, 0.625rem)",
    border: "1px solid var(--color-border, #DDD3D4)",
    fontSize: "0.875rem",
    color: "var(--color-text, #301316)",
    outline: "none",
    fontFamily: "Inter, sans-serif",
    transition: "border-color 150ms",
    background: "var(--color-surface, white)",
    boxSizing: "border-box",
  },
  card: {
    background: "var(--color-surface, white)",
    border: "1px solid var(--color-border, #DDD3D4)",
    borderRadius: "var(--radius-lg, 1rem)",
    padding: "1.5rem",
    boxShadow: "0 1px 3px rgba(87,34,40,0.06)",
  },
};

const EMPTY = {
  name: "",
  role: "",
  rating: 5,
  review: "",
  avatar_url: "",
  is_active: true,
  sort_order: 0,
};

// ── Star rating selector ──────────────────────────────────────────
function StarSelector({ value, onChange }) {
  return (
    <div style={{ display: "flex", gap: "0.25rem" }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "0.125rem",
          }}
        >
          <Star
            size={22}
            fill={n <= value ? "#F49E0B" : "none"}
            style={{
              color: n <= value ? "#F49E0B" : "#9A7A7E",
              transition: "color 150ms",
            }}
          />
        </button>
      ))}
    </div>
  );
}

// ── Star display (read-only) ──────────────────────────────────────
function StarDisplay({ rating = 5 }) {
  return (
    <div style={{ display: "flex", gap: "0.15rem" }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={12}
          fill={n <= rating ? "#F49E0B" : "none"}
          style={{ color: n <= rating ? "#F49E0B" : "#9A7A7E" }}
        />
      ))}
    </div>
  );
}

// ── Review card ───────────────────────────────────────────────────
function ReviewCard({ review, onEdit, onDelete, onToggle }) {
  const [deleting, setDeleting] = useState(false);
  const [toggling, setToggling] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Delete review from "${review.name}"? This cannot be undone.`))
      return;
    setDeleting(true);
    try {
      await reviewsApi.delete(review._id);
      toast.success("Review deleted");
      onDelete(review._id);
    } catch (err) {
      toast.error(err.message || "Failed to delete");
    } finally {
      setDeleting(false);
    }
  };

  const handleToggle = async () => {
    setToggling(true);
    try {
      const updated = await reviewsApi.update(review._id, {
        is_active: !review.is_active,
      });
      toast.success(
        updated.data.is_active ? "Review published" : "Review hidden",
      );
      onToggle(updated.data);
    } catch (err) {
      toast.error(err.message || "Failed to update");
    } finally {
      setToggling(false);
    }
  };

  return (
    <div
      style={{
        ...S.card,
        opacity: review.is_active ? 1 : 0.6,
        transition: "opacity 200ms",
        position: "relative",
      }}
    >
      {/* Active badge */}
      <div style={{ position: "absolute", top: "1rem", right: "1rem" }}>
        <span
          style={{
            fontSize: "0.65rem",
            fontWeight: 700,
            padding: "0.2rem 0.55rem",
            borderRadius: "9999px",
            fontFamily: "Plus Jakarta Sans, sans-serif",
            background: review.is_active ? "#FEF5E7" : "#FEF8EE",
            color: review.is_active ? "#F49E0B" : "#9A7A7E",
            textTransform: "uppercase",
          }}
        >
          {review.is_active ? "Published" : "Hidden"}
        </span>
      </div>

      {/* Stars */}
      <StarDisplay rating={review.rating} />

      {/* Review text */}
      <p
        style={{
          fontSize: "0.875rem",
          lineHeight: 1.65,
          color: "var(--color-text-secondary, #754a4f)",
          margin: "0.75rem 0 1rem",
          fontStyle: "italic",
          display: "-webkit-box",
          WebkitLineClamp: 4,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        &ldquo;{review.review}&rdquo;
      </p>

      {/* Author */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.625rem",
          marginBottom: "1.25rem",
        }}
      >
        <div
          style={{
            width: "2.25rem",
            height: "2.25rem",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #F49E0B, #301316)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            color: "white",
            fontSize: "0.875rem",
            fontWeight: 700,
            fontFamily: "Plus Jakarta Sans, sans-serif",
          }}
        >
          {review.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <p
            style={{
              fontFamily: "Plus Jakarta Sans, sans-serif",
              fontWeight: 700,
              fontSize: "0.875rem",
              color: "var(--color-text, #301316)",
              margin: 0,
            }}
          >
            {review.name}
          </p>
          {review.role && (
            <p
              style={{
                fontSize: "0.75rem",
                color: "var(--color-text-muted, #9A7A7E)",
                margin: 0,
              }}
            >
              {review.role}
            </p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          borderTop: "1px solid #FEF8EE",
          paddingTop: "1rem",
        }}
      >
        <button
          onClick={() => onEdit(review)}
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.375rem",
            padding: "0.5rem",
            borderRadius: "0.5rem",
            border: "1px solid var(--color-border, #DDD3D4)",
            background: "var(--color-surface, white)",
            cursor: "pointer",
            fontSize: "0.8rem",
            fontWeight: 600,
            color: "var(--color-text-secondary, #754a4f)",
            fontFamily: "Plus Jakarta Sans, sans-serif",
            transition: "all 150ms",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--color-primary-dark, #99561c)";
            e.currentTarget.style.color = "var(--color-primary-dark, #99561c)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--color-border, #DDD3D4)";
            e.currentTarget.style.color = "#754a4f";
          }}
        >
          <Edit2 size={13} /> Edit
        </button>

        <button
          onClick={handleToggle}
          disabled={toggling}
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.375rem",
            padding: "0.5rem",
            borderRadius: "0.5rem",
            border: "1px solid var(--color-border, #DDD3D4)",
            background: "var(--color-surface, white)",
            cursor: "pointer",
            fontSize: "0.8rem",
            fontWeight: 600,
            color: "var(--color-text-secondary, #754a4f)",
            fontFamily: "Plus Jakarta Sans, sans-serif",
            transition: "all 150ms",
            opacity: toggling ? 0.5 : 1,
          }}
        >
          {toggling ? (
            <Loader2 size={13} className="animate-spin" />
          ) : review.is_active ? (
            <EyeOff size={13} />
          ) : (
            <Eye size={13} />
          )}
          {review.is_active ? "Hide" : "Show"}
        </button>

        <button
          onClick={handleDelete}
          disabled={deleting}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0.5rem 0.75rem",
            borderRadius: "0.5rem",
            border: "1px solid #9A7A7E",
            background: "#F2EDEE",
            cursor: "pointer",
            color: "#4E1F24",
            transition: "all 150ms",
            opacity: deleting ? 0.5 : 1,
          }}
        >
          {deleting ? (
            <Loader2 size={13} className="animate-spin" />
          ) : (
            <Trash2 size={13} />
          )}
        </button>
      </div>
    </div>
  );
}

// ── Create / Edit modal ───────────────────────────────────────────
function ReviewModal({ initial, onClose, onSave }) {
  const [form, setForm] = useState(initial || EMPTY);
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (!form.review.trim()) {
      toast.error("Review text is required");
      return;
    }

    setSaving(true);
    try {
      let result;
      if (form._id) {
        result = await reviewsApi.update(form._id, form);
        toast.success("Review updated");
      } else {
        result = await reviewsApi.create(form);
        toast.success("Review created");
      }
      onSave(result.data);
      onClose();
    } catch (err) {
      toast.error(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        background: "rgba(87,34,40,0.5)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--color-surface, white)",
          borderRadius: "var(--radius-lg, 1rem)",
          padding: "1.75rem",
          width: "100%",
          maxWidth: "560px",
          boxShadow: "0 24px 48px rgba(87,34,40,0.15)",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "1.5rem",
          }}
        >
          <h2
            style={{
              fontFamily: "Plus Jakarta Sans, sans-serif",
              fontWeight: 800,
              fontSize: "1.125rem",
              color: "var(--color-text, #301316)",
              margin: 0,
            }}
          >
            {form._id ? "Edit Review" : "Add Review"}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--color-text-muted, #9A7A7E)",
              padding: "0.25rem",
            }}
          >
            <X size={20} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "1.125rem" }}
        >
          {/* Name */}
          <div>
            <label style={S.label}>
              Client Name{" "}
              <span style={{ color: "var(--color-primary-dark, #99561c)" }}>*</span>
            </label>
            <input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. Chukwuemeka Obi"
              style={S.input}
              onFocus={(e) =>
                (e.target.style.borderColor = "var(--color-primary-dark, #99561c)")
              }
              onBlur={(e) =>
                (e.target.style.borderColor = "var(--color-border, #DDD3D4)")
              }
            />
          </div>

          {/* Role */}
          <div>
            <label style={S.label}>Role / Location</label>
            <input
              value={form.role}
              onChange={(e) => set("role", e.target.value)}
              placeholder="e.g. Land Buyer, Lekki"
              style={S.input}
              onFocus={(e) =>
                (e.target.style.borderColor = "var(--color-primary-dark, #99561c)")
              }
              onBlur={(e) =>
                (e.target.style.borderColor = "var(--color-border, #DDD3D4)")
              }
            />
          </div>

          {/* Rating */}
          <div>
            <label style={S.label}>Star Rating</label>
            <StarSelector
              value={form.rating}
              onChange={(v) => set("rating", v)}
            />
          </div>

          {/* Review text */}
          <div>
            <label style={S.label}>
              Review Text{" "}
              <span style={{ color: "var(--color-primary-dark, #99561c)" }}>*</span>
            </label>
            <textarea
              value={form.review}
              onChange={(e) => set("review", e.target.value)}
              placeholder="What the client said about their experience..."
              rows={4}
              style={{ ...S.input, resize: "vertical" }}
              onFocus={(e) =>
                (e.target.style.borderColor = "var(--color-primary-dark, #99561c)")
              }
              onBlur={(e) =>
                (e.target.style.borderColor = "var(--color-border, #DDD3D4)")
              }
            />
          </div>

          {/* Sort order + Published row */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "1rem",
            }}
          >
            <div>
              <label style={S.label}>Display Order</label>
              <input
                type="number"
                value={form.sort_order}
                onChange={(e) =>
                  set("sort_order", parseInt(e.target.value) || 0)
                }
                min={0}
                style={S.input}
                onFocus={(e) =>
                  (e.target.style.borderColor = "var(--color-primary-dark, #99561c)")
                }
                onBlur={(e) =>
                  (e.target.style.borderColor = "var(--color-border, #DDD3D4)")
                }
              />
              <p
                style={{
                  fontSize: "0.7rem",
                  color: "var(--color-text-muted, #9A7A7E)",
                  marginTop: "0.25rem",
                }}
              >
                Lower = shown first
              </p>
            </div>
            <div>
              <label style={S.label}>Status</label>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  paddingTop: "0.625rem",
                }}
              >
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => set("is_active", e.target.checked)}
                    style={{
                      width: "1rem",
                      height: "1rem",
                      accentColor: "#99561c",
                    }}
                  />
                  <span
                    style={{
                      fontSize: "0.875rem",
                      color: "var(--color-text, #301316)",
                      fontWeight: 600,
                    }}
                  >
                    Published
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div
            style={{ display: "flex", gap: "0.625rem", paddingTop: "0.5rem" }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: "0.75rem",
                borderRadius: "var(--radius, 0.625rem)",
                border: "1px solid var(--color-border, #DDD3D4)",
                background: "var(--color-surface, white)",
                color: "var(--color-text-secondary, #754a4f)",
                fontFamily: "Plus Jakarta Sans, sans-serif",
                fontWeight: 600,
                fontSize: "0.875rem",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{
                flex: 2,
                padding: "0.75rem",
                borderRadius: "var(--radius, 0.625rem)",
                border: "none",
                background: "linear-gradient(135deg, #F49E0B, #99561C)",
                color: "white",
                fontFamily: "Plus Jakarta Sans, sans-serif",
                fontWeight: 700,
                fontSize: "0.875rem",
                cursor: saving ? "not-allowed" : "pointer",
                opacity: saving ? 0.7 : 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
              }}
            >
              {saving ? (
                <>
                  <Loader2 size={15} className="animate-spin" /> Saving...
                </>
              ) : form._id ? (
                "Save Changes"
              ) : (
                "Add Review"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────
export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modal, setModal] = useState(null); // null | EMPTY | review object
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await reviewsApi.getAll();
      setReviews(res.data || []);
    } catch (err) {
      setError(err.message || "Failed to load reviews");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = (saved) => {
    setReviews((prev) => {
      const idx = prev.findIndex((r) => r._id === saved._id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [saved, ...prev];
    });
  };

  const handleDelete = (id) =>
    setReviews((prev) => prev.filter((r) => r._id !== id));
  const handleToggle = (updated) =>
    setReviews((prev) =>
      prev.map((r) => (r._id === updated._id ? updated : r)),
    );

  const filtered = reviews.filter(
    (r) =>
      !search ||
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.review.toLowerCase().includes(search.toLowerCase()),
  );

  const published = reviews.filter((r) => r.is_active).length;

  return (
    <AdminShell>
      <div style={S.page}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: "2rem",
            flexWrap: "wrap",
            gap: "1rem",
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                marginBottom: "0.25rem",
              }}
            >
              <Star
                size={20}
                style={{ color: "var(--color-primary-dark, #99561c)" }}
              />
              <h1
                style={{
                  fontFamily: "Plus Jakarta Sans, sans-serif",
                  fontWeight: 800,
                  fontSize: "1.5rem",
                  color: "var(--color-text, #301316)",
                  margin: 0,
                }}
              >
                Client Reviews
              </h1>
            </div>
            <p
              style={{
                color: "var(--color-text-muted, #9A7A7E)",
                fontSize: "0.875rem",
                margin: 0,
              }}
            >
              {published} of {reviews.length} review
              {reviews.length !== 1 ? "s" : ""} published on the homepage
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.625rem" }}>
            <button
              onClick={load}
              disabled={loading}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.5rem 1rem",
                borderRadius: "var(--radius, 0.625rem)",
                border: "1px solid var(--color-border, #DDD3D4)",
                background: "var(--color-surface, white)",
                color: "var(--color-text-secondary, #754a4f)",
                fontFamily: "Plus Jakarta Sans, sans-serif",
                fontWeight: 600,
                fontSize: "0.8125rem",
                cursor: "pointer",
                opacity: loading ? 0.6 : 1,
              }}
            >
              <RefreshCw
                size={13}
                style={{
                  animation: loading ? "spin 1s linear infinite" : "none",
                }}
              />
              Refresh
            </button>
            <button
              onClick={() => setModal(EMPTY)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.5rem 1.125rem",
                borderRadius: "var(--radius, 0.625rem)",
                border: "none",
                background: "linear-gradient(135deg, #F49E0B, #99561C)",
                color: "white",
                fontFamily: "Plus Jakarta Sans, sans-serif",
                fontWeight: 700,
                fontSize: "0.875rem",
                cursor: "pointer",
              }}
            >
              <Plus size={15} /> Add Review
            </button>
          </div>
        </div>

        {/* Search */}
        <div
          style={{
            position: "relative",
            marginBottom: "1.5rem",
            maxWidth: "360px",
          }}
        >
          <Search
            size={15}
            style={{
              position: "absolute",
              left: "0.75rem",
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--color-text-muted, #9A7A7E)",
            }}
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or review text..."
            style={{ ...S.input, paddingLeft: "2.25rem" }}
            onFocus={(e) =>
              (e.target.style.borderColor = "var(--color-primary-dark, #99561c)")
            }
            onBlur={(e) =>
              (e.target.style.borderColor = "var(--color-border, #DDD3D4)")
            }
          />
        </div>

        {/* Error */}
        {error && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              padding: "1rem 1.25rem",
              borderRadius: "0.875rem",
              background: "#F2EDEE",
              border: "1px solid #9A7A7E",
              marginBottom: "1.5rem",
            }}
          >
            <AlertCircle
              size={16}
              style={{ color: "#4E1F24", flexShrink: 0 }}
            />
            <p style={{ color: "#4E1F24", fontSize: "0.875rem", margin: 0 }}>
              {error}
            </p>
          </div>
        )}

        {/* Loading skeletons */}
        {loading && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: "1.25rem",
            }}
          >
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                style={{
                  ...S.card,
                  animation: "pulse 1.5s ease-in-out infinite",
                }}
              >
                <div
                  style={{
                    height: "0.75rem",
                    background: "var(--color-surface-3, #FEF8EE)",
                    borderRadius: "0.25rem",
                    width: "40%",
                    marginBottom: "1rem",
                  }}
                />
                <div
                  style={{
                    height: "4rem",
                    background: "var(--color-surface-3, #FEF8EE)",
                    borderRadius: "0.25rem",
                    marginBottom: "1rem",
                  }}
                />
                <div
                  style={{
                    height: "0.875rem",
                    background: "var(--color-surface-3, #FEF8EE)",
                    borderRadius: "0.25rem",
                    width: "60%",
                  }}
                />
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && filtered.length === 0 && (
          <div
            style={{
              ...S.card,
              textAlign: "center",
              padding: "3rem",
              color: "var(--color-text-muted, #9A7A7E)",
            }}
          >
            <Star size={36} style={{ margin: "0 auto 1rem", opacity: 0.3 }} />
            <p
              style={{
                fontFamily: "Plus Jakarta Sans, sans-serif",
                fontWeight: 700,
                fontSize: "1rem",
                color: "var(--color-text, #301316)",
                marginBottom: "0.5rem",
              }}
            >
              {search ? "No reviews match your search" : "No reviews yet"}
            </p>
            <p style={{ fontSize: "0.875rem", marginBottom: "1.25rem" }}>
              {search
                ? "Try a different search term."
                : "Add your first client review to display it on the homepage."}
            </p>
            {!search && (
              <button
                onClick={() => setModal(EMPTY)}
                style={{
                  padding: "0.625rem 1.25rem",
                  borderRadius: "var(--radius, 0.625rem)",
                  border: "none",
                  background: "var(--color-primary, #F49E0B)",
                  color: "white",
                  fontFamily: "Plus Jakarta Sans, sans-serif",
                  fontWeight: 700,
                  fontSize: "0.875rem",
                  cursor: "pointer",
                }}
              >
                <Plus
                  size={14}
                  style={{ display: "inline", marginRight: "0.375rem" }}
                />
                Add First Review
              </button>
            )}
          </div>
        )}

        {/* Reviews grid */}
        {!loading && filtered.length > 0 && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: "1.25rem",
            }}
          >
            {filtered.map((r) => (
              <ReviewCard
                key={r._id}
                review={r}
                onEdit={(r) => setModal(r)}
                onDelete={handleDelete}
                onToggle={handleToggle}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {modal !== null && (
        <ReviewModal
          initial={modal._id ? modal : null}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }
      `}</style>
    </AdminShell>
  );
}
