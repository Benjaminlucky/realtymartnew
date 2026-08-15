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

function sanitizeArticleHtml(html) {
  if (!html) return "";
  return sanitizeHtml(html, {
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
