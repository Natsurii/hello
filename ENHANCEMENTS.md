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

## P1 — Performance — done (uncommitted)

- [x] `<link rel="preconnect" href="https://cdn.jsdelivr.net">` in all pages (index, blogs, about, 404 + build.py template)
- [x] `defer` jQuery + Prism; inline body scripts moved into `DOMContentLoaded` listeners so they run after the deferred libs
- [x] `@font-face` IBM VGA: `font-display: swap` + `<link rel="preload" as="font" type="font/ttf">` on every page
- [x] Animated favicon: skipped under `prefers-reduced-motion` (static favicon stays), loop pauses on `visibilitychange`, spinner 20ms → 100ms
- [x] `oia-uia.gif` (668K): **kept as GIF** — first converted to animated WebP (12K) but it rendered broken (Firefox has no animated-WebP support); P0's alt + `320x320` sizing already handles CLS

## P2 — Motion & Layout — done (uncommitted)

- [x] `prefers-reduced-motion`: art revealed instantly (skip typing in `typeTextInBatches`), `cursor-blink` + `fadeIn` disabled (shared `REDUCED_MOTION` flag; favicon already skipped)
- [x] `crt-drift` → `translateY(-15vh ↔ 110vh)`; `.sw-thumb` → `transition: transform` + `translateX(100%)` (exactly the old `left: 50%` target)
- [x] `.theme-switch`: `env(safe-area-inset-bottom/right)` in `calc()` + `touch-action: manipulation`
- [x] `initFitObserver`: `ResizeObserver` on body + `resize` listener, rAF-coalesced, refits dividers/caps
- [x] `fitArtFontSize`: pre art scales to `innerWidth / (maxCols * 0.56)`, capped at CSS size (no upscale); **6px floor** — below it (small phones vs 240-col art) the CSS size is kept and the container pans horizontally (`overflow-x: auto` + `touch-action: auto`) instead of shrinking to an illegible thumbnail (art stores text via `data('ascii-text')` for refit on resize)

## P3 — Copy & SEO — done (uncommitted)

- [x] `about.html`: "Instititute" → "Institute"; employer heading `<h2>` → `<h3>` (now under `Work`, matches the education entry pattern)
- [x] `404.html` og/twitter/description meta → "Page not found. The page you are looking for does not exist or was moved."
- [x] `welcome-to-my-blog.md` blockquote → curly “ ”
- [x] `<meta name="theme-color">` created + synced in `applyTheme` (reads `--bg` computed value)
- [x] sitemap.xml: `about.html` added (build.py seed), regenerated
- [x] Blog dates: decided — keep retro `[2026-03-29]` display, wrapped in `<time datetime>` for semantics (no `Intl.DateTimeFormat`)
- [x] Bonus: `parseMarkdown` blockquote regex fixed (`^> ` never matched — `>` is escaped to `&gt;` before that step, so blockquotes rendered as plain text)

## Contact page — done

- [x] `contact.html`: retro terminal form (name/email/message) + status box (`#contact-status`, `aria-live="polite"`), Turnstile div, honeypot field
- [x] `functions/api/contact.js` (Pages Function): validate → honeypot → Turnstile siteverify (skipped while `TURNSTILE_SECRET` secret unset) → Resend API → `natsurii@protonmail.com`; key via Pages secret, never in source
- [x] `header.utf8ans`: nav box widened, `<contact>` token; sr-nav + art link on all pages; sitemap += contact.html; `contact.png` og card via make_og.py
- [ ] User setup (dashboard): Resend API key → Pages secret `RESEND_API_KEY`; Turnstile widget sitekey → `contact.html` `data-sitekey` + Pages secret `TURNSTILE_SECRET`

## Notes

- build.py is the source of truth for `blogs/*.html` — fix the template, then run `python3 build.py`
- CSP: pages use inline scripts (noted "CSP violation >:D") — out of scope for this plan
