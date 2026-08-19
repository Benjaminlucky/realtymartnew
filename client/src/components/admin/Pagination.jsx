"use client";

/**
 * Pagination
 *
 * Reusable footer bar for all admin list pages.
 * Shows: total count label + perPage selector + prev/page-numbers/next.
 *
 * Props:
 *   page        {number}   current page (1-indexed)
 *   totalPages  {number}
 *   total       {number}   total record count
 *   perPage     {number}   current per-page value
 *   perPageOptions {number[]}  options for the selector (default [10, 25, 50, 100])
 *   onPage      {fn}       (newPage: number) => void
 *   onPerPage   {fn}       (newPerPage: number) => void
 *   label       {string}   noun for the count label e.g. "listings", "enquiries"
 */
export default function Pagination({
  page,
  totalPages,
  total,
  perPage,
  perPageOptions = [10, 25, 50, 100],
  onPage,
  onPerPage,
  label = "records",
}) {
  if (totalPages <= 1 && total <= perPageOptions[0]) return null;

  // Which page numbers to show (max 5 around current)
  const pages = [];
  const start = Math.max(1, Math.min(page - 2, totalPages - 4));
  const end = Math.min(totalPages, start + 4);
  for (let p = start; p <= end; p++) pages.push(p);

  const btnBase = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: "2rem",
    height: "2rem",
    padding: "0 0.5rem",
    borderRadius: "0.5rem",
    border: "1px solid #DDD3D4",
    background: "white",
    color: "#754A4F",
    fontFamily: "Plus Jakarta Sans, sans-serif",
    fontWeight: 600,
    fontSize: "0.8125rem",
    cursor: "pointer",
    transition: "all 150ms",
    lineHeight: 1,
  };

  const activeBtnStyle = {
    ...btnBase,
    background: "#F49E0B",
    borderColor: "#99561c",
    color: "#301316",
  };

  const disabledBtnStyle = {
    ...btnBase,
    opacity: 0.35,
    cursor: "not-allowed",
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "0.75rem",
        marginTop: "1.25rem",
        paddingTop: "1.25rem",
        borderTop: "1px solid #FEF8EE",
      }}
    >
      {/* Left: total + per-page selector */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.875rem",
          flexWrap: "wrap",
        }}
      >
        <p
          style={{
            fontSize: "0.8125rem",
            color: "#9A7A7E",
            margin: 0,
            fontFamily: "Plus Jakarta Sans, sans-serif",
          }}
        >
          <strong style={{ color: "#301316" }}>{total.toLocaleString()}</strong>{" "}
          {label}
        </p>

        {/* Per-page selector */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span
            style={{
              fontSize: "0.75rem",
              color: "#9A7A7E",
              fontFamily: "Plus Jakarta Sans, sans-serif",
            }}
          >
            Show
          </span>
          <select
            value={perPage}
            onChange={(e) => {
              onPerPage(Number(e.target.value));
            }}
            style={{
              padding: "0.3rem 0.625rem",
              borderRadius: "0.5rem",
              border: "1px solid #DDD3D4",
              background: "white",
              color: "#301316",
              fontFamily: "Plus Jakarta Sans, sans-serif",
              fontWeight: 600,
              fontSize: "0.8125rem",
              cursor: "pointer",
              outline: "none",
            }}
            onFocus={(e) => (e.target.style.borderColor = "#F49E0B")}
            onBlur={(e) => (e.target.style.borderColor = "#DDD3D4")}
          >
            {perPageOptions.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          <span
            style={{
              fontSize: "0.75rem",
              color: "#9A7A7E",
              fontFamily: "Plus Jakarta Sans, sans-serif",
            }}
          >
            per page
          </span>
        </div>
      </div>

      {/* Right: page navigation */}
      {totalPages > 1 && (
        <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
          {/* Prev */}
          <button
            onClick={() => onPage(Math.max(1, page - 1))}
            disabled={page === 1}
            style={page === 1 ? disabledBtnStyle : btnBase}
            onMouseEnter={(e) => {
              if (page !== 1) {
                e.currentTarget.style.borderColor = "#F49E0B";
                e.currentTarget.style.color = "#F49E0B";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#DDD3D4";
              e.currentTarget.style.color = "#754A4F";
            }}
          >
            ‹
          </button>

          {/* First page + ellipsis */}
          {start > 1 && (
            <>
              <button
                onClick={() => onPage(1)}
                style={btnBase}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#F49E0B";
                  e.currentTarget.style.color = "#F49E0B";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#DDD3D4";
                  e.currentTarget.style.color = "#754A4F";
                }}
              >
                1
              </button>
              {start > 2 && (
                <span
                  style={{
                    padding: "0 0.25rem",
                    color: "#9A7A7E",
                    fontSize: "0.875rem",
                  }}
                >
                  …
                </span>
              )}
            </>
          )}

          {/* Page numbers */}
          {pages.map((p) => (
            <button
              key={p}
              onClick={() => onPage(p)}
              style={p === page ? activeBtnStyle : btnBase}
              onMouseEnter={(e) => {
                if (p !== page) {
                  e.currentTarget.style.borderColor = "#F49E0B";
                  e.currentTarget.style.color = "#F49E0B";
                }
              }}
              onMouseLeave={(e) => {
                if (p !== page) {
                  e.currentTarget.style.borderColor = "#DDD3D4";
                  e.currentTarget.style.color = "#754A4F";
                }
              }}
            >
              {p}
            </button>
          ))}

          {/* Last page + ellipsis */}
          {end < totalPages && (
            <>
              {end < totalPages - 1 && (
                <span
                  style={{
                    padding: "0 0.25rem",
                    color: "#9A7A7E",
                    fontSize: "0.875rem",
                  }}
                >
                  …
                </span>
              )}
              <button
                onClick={() => onPage(totalPages)}
                style={btnBase}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#F49E0B";
                  e.currentTarget.style.color = "#F49E0B";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#DDD3D4";
                  e.currentTarget.style.color = "#754A4F";
                }}
              >
                {totalPages}
              </button>
            </>
          )}

          {/* Next */}
          <button
            onClick={() => onPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            style={page === totalPages ? disabledBtnStyle : btnBase}
            onMouseEnter={(e) => {
              if (page !== totalPages) {
                e.currentTarget.style.borderColor = "#F49E0B";
                e.currentTarget.style.color = "#F49E0B";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#DDD3D4";
              e.currentTarget.style.color = "#754A4F";
            }}
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
}
