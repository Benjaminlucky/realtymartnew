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
const { marked } = require("marked");
const SITE_URL = process.env.FRONTEND_URL || "";

marked.setOptions({ gfm: true, breaks: false });

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
// The paste box has to work whether the owner drops real HTML markup,
// Markdown/MDX, or just types/pastes plain paragraphs. Failure modes
// without this:
//   1. HTML copied from a source that displays it pre-escaped (a code
//      viewer, some AI chat UIs) arrives as literal "&lt;p&gt;" text.
//      sanitize-html correctly treats that as text, not markup, so the
//      tags show up as visible text on the published page instead of
//      being rendered.
//   2. Plain text with no tags at all collapses into one unstyled blob
//      — HTML ignores newlines, so paragraph breaks disappear.
//   3. Markdown/MDX (##, **bold**, tables, a leading --- frontmatter
//      block) has no real tags of its own, or is mixed with a few raw
//      HTML/JSX elements (<div className="...">, <Tip>) — sanitize-html
//      only understands tags, so the Markdown syntax renders as literal
//      text right alongside whatever real tags are present.
const HAS_REAL_TAG = /<[a-zA-Z][a-zA-Z0-9-]*(\s|>|\/>)/;
const HAS_ESCAPED_TAG = /&lt;[a-zA-Z][a-zA-Z0-9-]*(\s|&gt;|\/)/i;
const HAS_MARKDOWN_SYNTAX =
  /(^|\n) {0,3}#{1,6}\s+\S|\*\*[^\n*]+\*\*|(^|\n) {0,3}[-*+]\s+\S|(^|\n) {0,3}\d+\.\s+\S|(^|\n)\|.+\|[ \t]*($|\n)|\[[^\]\n]+\]\([^)\n]+\)/;

// Strips a leading YAML frontmatter block (--- ... ---). The admin UI
// already extracts this client-side to prefill title/slug/excerpt, so
// this is just a safety net for content that reaches here with it intact.
function stripFrontmatter(raw) {
  const match = raw.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/);
  return match ? raw.slice(match[0].length) : raw;
}

// The content-generation pipeline this site's articles come from emits
// a `<Tip def="...">term</Tip>` JSX shorthand for the hover-tooltip
// component, plus JSX's `className` instead of HTML's `class`. Neither
// is real HTML, so expand/rename them to what .rm-tip/.rm-tip-box in
// globals.css actually expects before handing the text to the Markdown
// parser.
function expandCustomComponents(md) {
  return md
    .replace(/<Tip\s+([^>]*)>([\s\S]*?)<\/Tip>/g, (match, attrs, inner) => {
      const defMatch = attrs.match(/def="([^"]*)"/);
      const alignMatch = attrs.match(/align="([^"]*)"/);
      const def = defMatch ? defMatch[1] : "";
      const alignClass = alignMatch && alignMatch[1] === "right" ? " rm-tip-right" : "";
      return `<button type="button" class="rm-tip">${inner}<span class="rm-tip-box${alignClass}">${def}</span></button>`;
    })
    .replace(/\bclassName=/g, "class=");
}

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
  let html = stripFrontmatter(raw);

  // Pasted HTML that arrived already entity-escaped — decode once so
  // the tags are real tags again, not text that merely looks like tags.
  if (!HAS_REAL_TAG.test(html) && HAS_ESCAPED_TAG.test(html)) {
    html = decodeEntitiesOnce(html);
  }

  // Markdown/MDX — headers, bold, lists, tables, links, possibly mixed
  // with a few raw HTML/JSX elements. Checked ahead of "no real tag at
  // all" because MDX bodies often do contain real tags (<div>, <Tip>)
  // alongside Markdown syntax that sanitize-html alone can't render.
  if (HAS_MARKDOWN_SYNTAX.test(html)) {
    return marked.parse(expandCustomComponents(html));
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

// Tables are wide by nature (globals.css gives them a 460px min-width so
// columns don't crush on mobile) — without this wrapper that width has
// nowhere to go but past the viewport edge, blowing out horizontal
// scroll on the whole page. .rm-table-wrap (already in globals.css)
// gives the overflow its own scroll container instead. No author pasting
// HTML/Markdown ever remembers to add this by hand, so it's automatic.
function wrapTables(html) {
  return html.replace(/<table[^>]*>[\s\S]*?<\/table>/g, (table, offset, full) => {
    // Idempotent: sanitizeArticleHtml can run on content that's already
    // been through it before (a re-save, a migration script) — without
    // this check, each pass would nest another wrapper div around an
    // already-wrapped table.
    const before = full.slice(Math.max(0, offset - 40), offset);
    if (/<div class="rm-table-wrap">\s*$/.test(before)) return table;
    return `<div class="rm-table-wrap">${table}</div>`;
  });
}

function sanitizeArticleHtml(html) {
  if (!html) return "";
  const clean = sanitizeHtml(normalizeInput(html), {
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
  return wrapTables(clean);
}

module.exports = { sanitizeArticleHtml };
