# RealtyMart Theme Re-color — Instructions

The site is being re-themed to use **only** these three colors, in tints/shades/mixes of each other:
- Amber `#f49e0b` (primary)
- Wine `#572228` (secondary)
- White `#ffffff`

No other hue (no blue, green, purple, gray, red, etc.) may remain anywhere in the file you're assigned, including inline `style={{}}` objects, `rgba()`/`rgb()` calls, gradients, box-shadows, and any CSS.

## The palette (use these exact hex values)

| Token | Hex | Use for |
|---|---|---|
| primary | `#f49e0b` | Main CTA fill, brand accents, active/selected state |
| primary-dark | `#99561c` | Hover/active state of primary buttons (safe for white text) |
| primary-light | `#f8c060` | Lighter accent, secondary highlight |
| primary-lighter | `#fbddaa` | Very light accent (badges, subtle fills) |
| primary-muted | `#fef3e2` | Very light wash — selected-row bg, subtle highlight bg |
| secondary | `#572228` | Dark backgrounds (navs, footers, dark sections), headings |
| secondary-dark | `#361519` | Darkest bg (deep footer, hero overlays) |
| secondary-mid | `#7c5357` | Mid-tone wine, borders on dark bg |
| secondary-light | `#a38589` | Light wine, muted elements on dark bg |
| secondary-lighter | `#d0c1c3` | Lightest wine tint |
| surface | `#ffffff` | Page/card background |
| surface-2 | `#fffcf6` | Slightly tinted section background |
| surface-3 | `#fef8ee` | More tinted alternate surface |
| border | `#ddd3d4` | Default subtle divider/border |
| border-dark | `#9a7a7e` | Stronger border (input outlines, need to be visible) |
| text | `#301316` | Primary body text (near-black wine) |
| text-secondary | `#754a4f` | Secondary/label text |
| text-muted | `#9a7a7e` | Placeholder/de-emphasized text |
| text-inverse | `#ffffff` | Text on dark backgrounds |
| danger | `#4e1f24` | Destructive actions, error text/icons (deep wine reads as "serious") |
| danger-bg | `#f2edee` | Error banner/badge background |
| success-bg | `#fef5e7` | Success badge background (success text/icon = `primary` #f49e0b) |
| warning-bg | `#fdf0da` | Warning banner background (warning = `primary` #f49e0b) |
| info | `#896469` | Informational accents (replaces old blue/purple "info" colors) |
| info-bg | `#eee9ea` | Informational banner background |

There is **no separate "success" or "warning" hex** — both map to `primary` (#f49e0b). Differentiate success/warning/info/danger through **icon choice and background tint**, not hue, since only two hues exist in this system.

## The mapping table

`COLOR_MAPPING.json` (repo root) has two dictionaries:
- `hexMap`: lowercase old hex → new hex. Covers every color found in the codebase.
- `rgbMap`: `"r,g,b"` triplet → new `"r,g,b"` triplet, for `rgba(r,g,b,alpha)` / `rgb(r,g,b)` calls — replace only the three numbers, **keep the alpha value unchanged**.

Read this file first. For every hex code or `rgba()`/`rgb()` triplet in your assigned file(s):
1. Look it up (case-insensitively) in `hexMap` or `rgbMap`.
2. Replace with the mapped value, preserving the exact original format (uppercase stays uppercase hex digits if the original was uppercase; `rgba(...)` keeps its alpha channel).
3. If you find a color NOT in either map, pick the closest token above by hue/lightness — reds/corals/oranges/yellows → a `primary-*` shade; blues/greens/purples/teals → `info` or `success-bg`/`danger-bg` depending on context; grays → the `text-*`/`border-*`/`surface-*` scale by lightness. List anything you had to eyeball this way in your final report.

## Critical contrast rule — do not skip this

Plain `primary` (#f49e0b amber) **fails contrast with white text** (2.16:1, needs 4.5:1). Whenever a color you're replacing maps to `primary` **and** it's used as a `background`/`backgroundColor`/gradient fill with white or near-white text/icon color on it (a button, a badge, a filled pill), you must **also change that text/icon color** to `#301316` (the `text` token) instead of white. This applies to:
- Solid `background: "#f49e0b"` (or whatever it mapped from) with `color: "white"` / `"#fff"` / `"#ffffff"` nearby in the same style object or a child element.
- Gradients like `linear-gradient(135deg, #FF6B6B 0%, #E85555 100%)` → becomes `linear-gradient(135deg, #f49e0b 0%, #99561c 100%)`. If paired with white text, that's fine for the `#99561c` (primary-dark) end since it passes contrast (5.67:1), but check the visual — if the button text sits mostly over the lighter `#f49e0b` end, switch text to `#301316` instead.

Everywhere else (secondary, secondary-dark, danger, primary-dark used alone as a solid fill) white text is safe — those all pass 4.5:1+.

## Other rules

- **Box-shadows using black** (`rgba(0,0,0,0.1)` etc.): tint them wine instead — the rgbMap already maps `"0,0,0"` → `"87,34,40"`. Keep the same alpha/blur/spread values, only change the RGB triplet.
- **WhatsApp widget/buttons**: deliberately re-themed away from WhatsApp's brand green — use `secondary` (wine) as the solid fill with white icon, not green. This is intentional per the instruction that white is the *only* other allowed color.
- Do **not** touch anything unrelated to color: no renaming, no restructuring JSX, no touching non-color hex-like strings (Mongo ObjectIds, hashes, unrelated numeric literals). Only color values change.
- If a color is already referenced via `var(--color-primary, #FF6B6B)` (CSS variable with a hex fallback), just update the **fallback hex** to the new value — leave the `var(--color-primary)` part alone, do not change it to a different variable name.
- Preserve exact formatting/quoting style already used in the file.

## When done

Report: files touched, total replacements made, any colors you had to eyeball (not in the map), and any spot where you applied the white-text-on-amber contrast fix.
