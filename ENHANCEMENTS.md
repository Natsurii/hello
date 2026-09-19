# Enhancement Plan

From Web Interface Guidelines review. Status: `[x]` done, `[ ]` pending.
Line numbers below are anchors (file/section), not exact lines — re-locate when working.

## P0 — Accessibility — done (commit d7375ac)

- [x] Skip link + sr-only `<h1>` on every page (visible `<h1>` on 404)
- [x] Real `<nav class="sr-nav">` (Home/About/Blogs) — clipped until keyboard focus
- [x] `aria-hidden="true"` on decorative ASCII art containers + CRT scanbar
- [x] Art links get `tabindex="-1"` (`addHyperlinkToText` in script.js)
- [x] Link rest state: underline (content) / none (art), `:focus-visible` outlines
- [x] `aria-live="polite"` on `#blog-posts-list`, `#post-content`, loading divs
- [x] 404 visible fallback: "Page Not Found" + message + go-home link
- [x] `parseMarkdown` images: `loading="lazy"` + optional `![alt](url "WxH")` size
- [x] Loading strings → `…`; error messages include next step
- [x] build.py template updated; posts regenerated
- [ ] Verify GIF alt text ("Photo from Oia" is a guess from filename — couldn't view image)

## P1 — Performance

- [ ] `<link rel="preconnect" href="https://cdn.jsdelivr.net">` in all pages (index, blogs, about, 404 + build.py template)
- [ ] `defer` jQuery + Prism (currently render-blocking in `<head>`; blog pages only for Prism)
- [ ] `@font-face` IBM VGA: add `font-display: swap` + `<link rel="preload" as="font">`
- [ ] Animated favicon (script.js `initAnimatedFavicon`): skip under `prefers-reduced-motion`, pause via `visibilitychange`, throttle spinner interval 20ms → 100ms+ (swaps a new `<link>` node each frame)
- [ ] `content/blogs/images/welcome-to-my-blog/oia-uia.gif` (668K animated) → MP4/WebP or optimize

## P2 — Motion & Layout

- [ ] `prefers-reduced-motion`: reveal ASCII instantly (skip typing in `typeTextInBatches`), disable `cursor-blink` + `fadeIn`
- [ ] Animate `transform` not layout: `crt-drift` keyframes use `top`; `.sw-thumb` transitions `left`
- [ ] `.theme-switch`: `env(safe-area-inset-*)` offsets (fixed bottom-right overlaps home indicator) + `touch-action: manipulation`
- [ ] `fitAsciiLines`: add `ResizeObserver`/resize hook (dividers + image box caps mis-fit after rotation)
- [ ] `.ascii-container` mobile: 6px font floor is too small; art clips via `overflow-x: hidden` + `white-space: pre` — scale instead of clip

## P3 — Copy & SEO

- [ ] `about.html`: typo "Instititute" → "Institute"; employer `<h2>` → `<h3>` (link-in-heading)
- [ ] `404.html` og meta: "Page Not found. 404 site" → proper case + clearer description
- [ ] `content/blogs/welcome-to-my-blog.md`: straight quotes in blockquote → curly “ ”
- [ ] `<meta name="theme-color">` per theme (update in `applyTheme`, script.js)
- [ ] sitemap.xml: add `about.html` (edit build.py `sitemap_urls` seed)
- [ ] Blog dates: raw ISO `[2026-03-29]` → optional `Intl.DateTimeFormat` (conflicts with retro aesthetic — decide)

## Notes

- build.py is the source of truth for `blogs/*.html` — fix the template, then run `python3 build.py`
- CSP: pages use inline scripts (noted "CSP violation >:D") — out of scope for this plan
