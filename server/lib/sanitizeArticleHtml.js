"use strict";

/**
 * sanitizeArticleHtml.js
 *
 * Single source of truth for cleaning pasted article HTML before it is
 * stored. Used by both the save routes (POST/PUT /admin/blog) and the
 * live-preview route (POST /admin/blog/preview) so the admin preview and
 * the published page can never render different markup — they run the
 * exact same function.
 *
 * The allowlist intentionally keeps <button>/<span>/<div> (sanitize-html's
 * default allowlist strips these, which would silently destroy every
 * rm-tip tooltip) plus table/article/callout structure. <script> and
 * <style> are dropped along with their contents, and any attribute not
 * explicitly allowed — including every on* handler — is stripped.
 */

const sanitizeHtml = require("sanitize-html");
const SITE_URL = process.env.FRONTEND_URL || "";

const ALLOWED_TAGS = [
  "article", "h1", "h2", "h3", "h4", "h5", "h6",
  "p", "br", "hr",
  "ul", "ol", "li",
  "a", "strong", "b", "em", "i", "u", "s", "mark", "sup", "sub",
  "blockquote", "figure", "figcaption", "img",
  "table", "thead", "tbody", "tfoot", "tr", "th", "td",
  "div", "span", "button",
];

const ALLOWED_ATTRIBUTES = {
  "*": ["class"],
  a: ["href", "target", "rel"],
  img: ["src", "alt", "width", "height", "loading"],
  button: ["type", "class", "role", "aria-label", "aria-expanded"],
  span: ["class", "role", "aria-label"],
  th: ["class", "scope", "colspan", "rowspan"],
  td: ["class", "colspan", "rowspan"],
};

function isExternal(href) {
  if (!/^https?:\/\//i.test(href)) return false;
  if (!SITE_URL) return true;
  try {
    return new URL(href).host !== new URL(SITE_URL).host;
  } catch {
    return true;
  }
}

// ── Input normalization ─────────────────────────────────────────────
// The paste box has to work whether the owner drops real HTML markup
// or just types/pastes plain paragraphs. Two failure modes without this:
//   1. HTML copied from a source that displays it pre-escaped (a code
//      viewer, some AI chat UIs) arrives as literal "&lt;p&gt;" text.
//      sanitize-html correctly treats that as text, not markup, so the
//      tags show up as visible text on the published page instead of
//      being rendered.
//   2. Plain text with no tags at all collapses into one unstyled blob
//      — HTML ignores newlines, so paragraph breaks disappear.
const HAS_REAL_TAG = /<[a-zA-Z][a-zA-Z0-9-]*(\s|>|\/>)/;
const HAS_ESCAPED_TAG = /&lt;[a-zA-Z][a-zA-Z0-9-]*(\s|&gt;|\/)/i;

const NAMED_ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };

function decodeEntitiesOnce(str) {
  return str.replace(/&(#x[0-9a-fA-F]+|#[0-9]+|[a-zA-Z]+);/g, (match, body) => {
    if (body[0] === "#") {
      const code = body[1] === "x" || body[1] === "X"
        ? parseInt(body.slice(2), 16)
        : parseInt(body.slice(1), 10);
      return Number.isNaN(code) ? match : String.fromCodePoint(code);
    }
    return NAMED_ENTITIES[body.toLowerCase()] || match;
  });
}

function escapeText(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function normalizeInput(raw) {
  let html = raw;

  // Pasted HTML that arrived already entity-escaped — decode once so
  // the tags are real tags again, not text that merely looks like tags.
  if (!HAS_REAL_TAG.test(html) && HAS_ESCAPED_TAG.test(html)) {
    html = decodeEntitiesOnce(html);
  }

  // Genuinely no markup at all — treat every blank-line-separated block
  // as a paragraph, escaping stray "&"/"<"/">" so it renders literally
  // rather than being misread as markup.
  if (!HAS_REAL_TAG.test(html)) {
    html = html
      .split(/\r?\n\s*\r?\n/)
      .map((block) => block.trim())
      .filter(Boolean)
      .map((block) => `<p>${escapeText(block).replace(/\r?\n/g, "<br>")}</p>`)
      .join("\n");
  }

  return html;
}

function sanitizeArticleHtml(html) {
  if (!html) return "";
  return sanitizeHtml(normalizeInput(html), {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: ALLOWED_ATTRIBUTES,
    allowedSchemes: ["http", "https", "mailto"],
    nonTextTags: ["script", "style", "textarea", "noscript"],
    // Force target=_blank + safe rel on external links the author forgot
    // to mark, without touching internal/relative links.
    transformTags: {
      a: (tagName, attribs) => {
        if (isExternal(attribs.href)) {
          attribs.target = "_blank";
          attribs.rel = "noopener noreferrer";
        }
        return { tagName, attribs };
      },
      button: (tagName, attribs) => ({
        tagName,
        attribs: { ...attribs, type: "button" },
      }),
    },
  });
}

module.exports = { sanitizeArticleHtml };
