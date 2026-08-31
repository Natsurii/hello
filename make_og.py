#!/usr/bin/env python3
"""Generate Open Graph / link-preview ("embed card") images for every page.

Each card is a headless-Chrome screenshot of the page rendered in DARK mode at
1200x630 (the og:image / twitter:summary_large_image standard), written to
assets/og/<name>.png.

How it works:
  1. Serves the repo over a throwaway localhost HTTP server (the pages load
     their header/footer/markdown via fetch(), which needs an http: origin).
  2. Appends ?embed=1 so script.js skips the floating theme switch, and passes
     --force-prefers-reduced-motion so the drifting CRT scan-bar is suppressed.
  3. Uses an empty temp profile so localStorage has no saved theme, which means
     the anti-flash <head> snippet resolves to the default: DARK.

Run AFTER the generators so the pages (and their og:image tags) are up to date:

  python3 build.py            # regenerate blogs/*.html
  # python3 generate_about.py # needs resume.yml; edit about.html directly
  python3 make_og.py

No third-party Python deps (shutil/subprocess/http.server only) + Google Chrome.
Override the browser with --chrome PATH or the CHROME_BIN env var.
"""

import argparse
import http.server
import os
import shutil
import socketserver
import subprocess
import sys
import threading
from pathlib import Path

ROOT = Path(__file__).resolve().parent
OUT_DIR = ROOT / "assets" / "og"
CARD_W, CARD_H = 1200, 630
BUDGET_MS = 8000  # fast-forwards the ASCII typing + markdown fetch before capture


def find_chrome(override=None):
    if override:
        return override if os.path.exists(override) else None
    env = os.environ.get("CHROME_BIN")
    if env and os.path.exists(env):
        return env
    for name in ("google-chrome", "google-chrome-stable", "chromium",
                 "chromium-browser", "chrome"):
        p = shutil.which(name)
        if p:
            return p
    for p in ("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
              "/Applications/Chromium.app/Contents/MacOS/Chromium",
              "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge"):
        if os.path.exists(p):
            return p
    return None


def discover_pages():
    """Return sorted [(rel_path, url_path)] for every site page (no recursion
    into designs/ etc): top-level *.html plus blogs/*.html."""
    pages = []
    for html in sorted(ROOT.glob("*.html")):
        pages.append(html)
    for html in sorted((ROOT / "blogs").glob("*.html")):
        pages.append(html)
    return [p.relative_to(ROOT).as_posix() for p in pages]


class _SilentHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass  # keep output clean

    def __init__(self, *a, **kw):
        super().__init__(*a, directory=str(ROOT), **kw)


def shoot(chrome, url, out_path, w, h, budget):
    if out_path.exists():
        out_path.unlink()
    # NOTE: intentionally NO --user-data-dir. Each launch gets a fresh ephemeral
    # profile => empty localStorage => the anti-flash <head> snippet resolves to
    # the DARK default, and there's no shared-profile lock to hang on.
    cmd = [
        chrome,
        "--headless=new",
        "--disable-gpu",
        "--hide-scrollbars",
        "--force-device-scale-factor=1",
        "--force-prefers-reduced-motion",
        f"--window-size={w},{h}",
        f"--virtual-time-budget={budget}",
        f"--screenshot={out_path}",
        url,
    ]
    try:
        proc = subprocess.run(cmd, capture_output=True, text=True,
                              timeout=budget / 1000 + 25)
    except subprocess.TimeoutExpired:
        sys.stderr.write(f"  (timed out: {url})\n")
        return False
    ok = out_path.exists() and out_path.stat().st_size > 1024
    if not ok and proc.stderr:
        sys.stderr.write(proc.stderr[-800:] + "\n")
    return ok


def main():
    ap = argparse.ArgumentParser(description="Generate dark-mode embed/OG cards.")
    ap.add_argument("--chrome", help="Path to Chrome/Chromium binary")
    ap.add_argument("--out", default=str(OUT_DIR), help="Output directory")
    ap.add_argument("--width", type=int, default=CARD_W)
    ap.add_argument("--height", type=int, default=CARD_H)
    ap.add_argument("--budget", type=int, default=BUDGET_MS,
                    help="virtual-time budget in ms (wait for typing/fetch)")
    ap.add_argument("--only", action="append",
                    help="Only capture these page names (repeatable), e.g. --only index --only welcome-to-my-blog")
    args = ap.parse_args()

    chrome = find_chrome(args.chrome)
    if not chrome:
        sys.exit("ERROR: no Chrome/Chromium found. Install Chrome or pass --chrome PATH (or set CHROME_BIN).")

    out_dir = Path(args.out).resolve()
    out_dir.mkdir(parents=True, exist_ok=True)

    pages = discover_pages()
    if args.only:
        wanted = set(args.only)
        pages = [p for p in pages if Path(p).stem in wanted]
    if not pages:
        sys.exit("ERROR: no pages matched.")

    # Ephemeral server rooted at the site.
    httpd = socketserver.TCPServer(("127.0.0.1", 0), _SilentHandler)
    port = httpd.server_address[1]
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    print(f"Serving {ROOT} at http://127.0.0.1:{port}", flush=True)
    print(f"Browser: {chrome}", flush=True)

    failures = []
    for rel in pages:
        name = Path(rel).stem + ".png"
        url = f"http://127.0.0.1:{port}/{rel}?embed=1"
        out_path = out_dir / name
        ok = shoot(chrome, url, out_path, args.width, args.height, args.budget)
        size = out_path.stat().st_size if out_path.exists() else 0
        status = f"{size:>8} B" if ok else "FAILED  "
        print(f"  [{status}] {rel}", flush=True)
        if not ok:
            failures.append(rel)

    httpd.shutdown()

    print(f"\nDone: {len(pages) - len(failures)}/{len(pages)} cards in {out_dir}", flush=True)
    if failures:
        print("Failed pages:", ", ".join(failures))
        sys.exit(1)


if __name__ == "__main__":
    main()
