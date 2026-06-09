import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-heading",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata = {
  title: "Real Estate CMS",
  description: "Premium Properties Across Nigeria",
  // Declare locale and alternate links for international SEO.
  // We serve English (Nigerian) only — the x-default and en-NG alternates
  // both point to the same canonical URL which is correct for a single-locale site.
  alternates: {
    canonical: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
    languages: {
      "en-NG": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
      "x-default": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
    },
  },
};

const THEME_DEFAULTS = {
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

const VAR_MAP = [
  ["theme_primary", "--color-primary"],
  ["theme_primary_dark", "--color-primary-dark"],
  ["theme_primary_light", "--color-primary-light"],
  ["theme_primary_muted", "--color-primary-muted"],
  ["theme_secondary", "--color-secondary"],
  ["theme_secondary_dark", "--color-secondary-dark"],
  ["theme_secondary_mid", "--color-secondary-mid"],
  ["theme_secondary_light", "--color-secondary-light"],
  ["theme_accent", "--color-accent"],
  ["theme_accent_light", "--color-accent-light"],
  ["theme_surface", "--color-surface"],
  ["theme_surface_2", "--color-surface-2"],
  ["theme_surface_3", "--color-surface-3"],
  ["theme_border", "--color-border"],
  ["theme_text", "--color-text"],
  ["theme_text_secondary", "--color-text-secondary"],
  ["theme_text_muted", "--color-text-muted"],
  ["theme_radius", "--radius"],
  ["theme_radius_lg", "--radius-lg"],
  ["theme_radius_xl", "--radius-xl"],
];

async function getSettings() {
  try {
    const apiBase =
      process.env.API_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      "http://localhost:5000";
    const res = await fetch(`${apiBase}/settings`, {
      next: { revalidate: 30 },
    });
    if (!res.ok) return {};
    const json = await res.json();
    return json?.data?.settings || {};
  } catch {
    return {};
  }
}

function buildThemeCss(settings) {
  const t = { ...THEME_DEFAULTS };
  for (const [k] of VAR_MAP) {
    if (settings[k] && String(settings[k]).trim()) {
      t[k] = String(settings[k]).trim();
    }
  }
  const declarations = VAR_MAP.map(
    ([key, cssVar]) => `  ${cssVar}: ${t[key]};`,
  ).join("\n");
  const shadowDecl = `  --shadow-coral: 0 4px 16px ${t.theme_primary}55;`;
  return `:root,html,body {\n${declarations}\n${shadowDecl}\n}`;
}

export default async function RootLayout({ children }) {
  const settings = await getSettings();
  const themeCss = buildThemeCss(settings);
  const faviconUrl = settings.favicon || null;

  return (
    <html
      lang="en-NG"
      className={`${plusJakarta.variable} ${inter.variable}`}
      suppressHydrationWarning
    >
      <head>
        <style id="theme-vars" dangerouslySetInnerHTML={{ __html: themeCss }} />
        {faviconUrl ? (
          <>
            <link rel="icon" href={faviconUrl} />
            <link rel="shortcut icon" href={faviconUrl} />
            <link rel="apple-touch-icon" href={faviconUrl} />
          </>
        ) : (
          <link rel="icon" href="/favicon.ico" />
        )}
      </head>
      <body className="antialiased">
        {children}
        <Toaster
          richColors
          position="top-right"
          toastOptions={{ style: { fontFamily: "var(--font-body)" } }}
        />
      </body>
    </html>
  );
}
