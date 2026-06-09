// ─────────────────────────────────────────────────────────────────
// /api/theme.css — Dynamic theme stylesheet
//
// Reads colour settings from the DB on every request (cache: no-store)
// so theme changes go live within the browser's 30s cache window.
//
// Environment variable setup:
//   Netlify / Render / Railway → set API_URL as a private env var
//   pointing to your Express API (e.g. https://api.yourdomain.com)
//   It is intentionally NOT prefixed NEXT_PUBLIC_ so it is never
//   exposed to the browser bundle.
//
//   Local dev: works automatically via localhost:5000 fallback.
// ─────────────────────────────────────────────────────────────────

const DEFAULTS = {
  theme_primary: "#ff6b6b",
  theme_primary_dark: "#0f172a",
  theme_primary_light: "#38bdf8",
  theme_primary_muted: "#d1fae5",
  theme_secondary: "#1c1c2e",
  theme_secondary_dark: "#0f0f1a",
  theme_secondary_mid: "#2d2d44",
  theme_secondary_light: "#3d3d5c",
  theme_accent: "#f59e0b",
  theme_accent_light: "#fcd34d",
  theme_surface: "#ffffff",
  theme_surface_2: "#f8fafc",
  theme_surface_3: "#f1f5f9",
  theme_border: "#e2e8f0",
  theme_text: "#0f172a",
  theme_text_secondary: "#475569",
  theme_text_muted: "#94a3b8",
  theme_radius: "0.625rem",
  theme_radius_lg: "1rem",
  theme_radius_xl: "1.5rem",
};

export async function GET() {
  // Private server-side env var — never exposed to the browser.
  // Falls back to the public URL for local dev where both are identical.
  const apiBase =
    process.env.API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:5000";

  let settings = {};

  try {
    const res = await fetch(`${apiBase}/settings`, {
      next: { revalidate: 30 }, // 30s server-side cache — theme changes appear within 30s
      headers: { "Content-Type": "application/json" },
    });
    if (res.ok) {
      const json = await res.json();
      settings = json?.data?.settings || {};
    }
  } catch {
    // Serve defaults silently if API is unreachable
  }

  // Merge DB values over defaults — skip empty strings
  const t = { ...DEFAULTS };
  for (const [k, v] of Object.entries(settings)) {
    if (k in DEFAULTS && v && String(v).trim()) {
      t[k] = String(v).trim();
    }
  }

  // Map theme keys → CSS variable names
  const vars = [
    ["--color-primary", t.theme_primary],
    ["--color-primary-dark", t.theme_primary_dark],
    ["--color-primary-light", t.theme_primary_light],
    ["--color-primary-muted", t.theme_primary_muted],
    ["--color-secondary", t.theme_secondary],
    ["--color-secondary-dark", t.theme_secondary_dark],
    ["--color-secondary-mid", t.theme_secondary_mid],
    ["--color-secondary-light", t.theme_secondary_light],
    ["--color-accent", t.theme_accent],
    ["--color-accent-light", t.theme_accent_light],
    ["--color-surface", t.theme_surface],
    ["--color-surface-2", t.theme_surface_2],
    ["--color-surface-3", t.theme_surface_3],
    ["--color-border", t.theme_border],
    ["--color-text", t.theme_text],
    ["--color-text-secondary", t.theme_text_secondary],
    ["--color-text-muted", t.theme_text_muted],
    ["--radius", t.theme_radius],
    ["--radius-lg", t.theme_radius_lg],
    ["--radius-xl", t.theme_radius_xl],
    ["--shadow-coral", `0 4px 16px ${t.theme_primary}55`],
  ];

  const declarations = vars
    .map(([prop, val]) => `  ${prop}: ${val} !important;`)
    .join("\n");

  // Apply to :root, html, and body so the vars beat Tailwind v4's
  // @theme block and shadcn's @layer base :root block regardless of
  // load order — and so they reach the admin area as well as public pages.
  const css = `
/* Dynamic theme — /api/theme.css — reads live from DB */
:root {
${declarations}
}

html, body {
${declarations}
}
`.trim();

  return new Response(css, {
    headers: {
      "Content-Type": "text/css; charset=utf-8",
      // 30s browser cache, serve stale for up to 60s while revalidating.
      // Theme changes propagate within ~30s without hammering this endpoint.
      "Cache-Control": "public, max-age=30, stale-while-revalidate=60",
    },
  });
}
