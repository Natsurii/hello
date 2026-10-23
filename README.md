# Natsurii — Portfolio

A retro-terminal (IBM VGA) personal site running on **EmDash 1.0** (Astro + Cloudflare Workers, D1 + R2).

Live: https://portfolio.natsurii.workers.dev
Admin: https://portfolio.natsurii.workers.dev/_emdash/admin

The old static site lives on branch `v3` and `natsurii.pages.dev` redirects here.

## Requirements

- Node **22.16+** (uses `node:sqlite` in tooling)
- `pnpm@11.9.0` (`npm i -g pnpm@11.9.0`)
- A Cloudflare account with **D1**, **R2** and **Workers** enabled

## Local development

```bash
pnpm install
cp .env.example .env        # then paste the generated key, see below
pnpm dev                    # http://localhost:4321
```

`.env` is gitignored and holds `EMDASH_ENCRYPTION_KEY`. Generate one with:

```bash
openssl rand -base64 32
```

The dev server applies the seed **schema** on first boot. Seed **content** is a separate, explicit step (below).

### Seeding content

The seed CLI writes to a local SQLite path, so point it at the dev server's D1 emulation file:

```bash
pnpm exec astro dev stop                                  # stop first
rm -rf .wrangler/state .uploads                           # reset local D1/R2
pnpm dev &                                                # recreate schema
D=$(ls .wrangler/state/v3/d1/miniflare-D1DatabaseObject/*.sqlite | grep -v metadata)
npx emdash seed seed/seed.json --database "$D" --uploads-dir ./.uploads
for f in .uploads/*; do                                   # media into R2 emulation
  npx wrangler r2 object put "my-emdash-media/$(basename "$f")" --file "$f" --local
done
```

Notes:

- `$media` in the seed downloads and stores files at seed time; a failed download only **warns** and leaves the field empty — check for `Media: N skipped`.
- Localhost URLs in `$media` are rejected by SSRF protection; use a public URL.
- Post dates are set through the API, not the seed (`data.published_at` is just a field):
  `POST /_emdash/api/content/posts/{id}/publish` with `{"publishedAt": "<ISO>"}` and a Bearer token.
- Posts are published with `2026-03-29` / `2026-08-29` at 00:00 GMT+8 (`16:00Z` the day before).

### Admin access

The first visit to `/_emdash/admin` redirects to `/_emdash/admin/setup` until an admin exists. Setup creates the first user (`createFirstAdmin` only inserts while the `users` table is empty).

## Project layout

```
src/layouts/Base.astro        legacy shell: anti-flash theme, ASCII header/footer, skip-link
src/pages/                    index, 404, about, posts/ (list + detail), search, feed, sitemap
src/components/               RetroPortableText.astro renders Portable Text with legacy markup
src/styles/global.css         the design system (ported verbatim from the old site)
public/scripts/site.js        typing art, ASCII fitter, theme engine, animated favicon
seed/seed.json                schema + content
```

Content is Portable Text in D1; images are R2 media. The sitemap, robots and feed are EmDash defaults.

## Deployment

```bash
wrangler login              # once
pnpm build
npx wrangler deploy         # -> portfolio.natsurii.workers.dev
```

`wrangler deploy` does **not** run the Astro build, so always `pnpm build` first.

Resources naming lives in `wrangler.jsonc` (`DB`, `MEDIA`, cron). The production origin comes from `EMDASH_SITE_URL`, defaulting to the workers.dev URL in `astro.config.mjs`.

### Seeding a fresh remote database

`emdash seed` is local-only, so a new environment is filled by replaying a local DB:

1. create the D1 and R2 resources, put their real ids in `wrangler.jsonc`
2. boot the app once so the Worker runs migrations
3. dump the local DB and strip `PRAGMA`, `_cf_METADATA` and `*_fts_*` statements
4. `CREATE TABLE` statements first, then `INSERT`s, via `wrangler d1 execute --remote --file`
5. upload `.uploads/*` with `wrangler r2 object put --remote`
6. republish posts with the publish API to set dates and status

`_emdash_migrations` order matters — a missing migration makes the sitemap return 500 (`corrupted migrations`).

## Gotchas

- `*.pages.dev` cannot be served by a Worker; the Pages project hosting `natsurii.pages.dev` only redirects.
- `site.js` `typeTextInBatches` appends a text node instead of rewriting the string — `element.text(element.text() + batch)` is O(n²) and freezes on the 240-column hero art.
- Code blocks must have no whitespace between `<pre>` and `<code>`; `<pre>` renders it as a leading blank line.