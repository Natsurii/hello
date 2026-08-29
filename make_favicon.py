#!/usr/bin/env python3
"""Generate the animated N-gif favicon using the IBM VGA Px437 font.

Timeline (one full loop):
  Phase A - "N" puzzle, repeated 3x:
    N            : 1.0 s
    (none)       : 0.5 s
    full block   : 1.0 s
    (none)       : 0.5 s
    => 3.0 s per cycle, 9.0 s for all 3 cycles
  Phase B - spinner, for 3.0 s:
    - \ | / each 20 ms => 150 frames
  Loop repeats forever => 12.0 s total
"""

import os
from PIL import Image, ImageDraw, ImageFont

ASSETS = os.path.join(os.path.dirname(os.path.abspath(__file__)), "assets")
FONT_PATH = os.path.join(ASSETS, "Px437_IBM_VGA_9x16.ttf")
OUT_PATH = os.path.join(ASSETS, "favicon.gif")
ICO_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "favicon.ico")

SIZE = 32              # 32x32 pixels for the ico cell
FG = (255, 255, 255)   # white
BG = (0, 0, 0)         # black

# Font size: each VGA glyph is 9 wide x 16 tall; scale up for a 32px favicon.
SCALE = 2
GLYPH_W = 9 * SCALE
GLYPH_H = 16 * SCALE


def render_glyph(text, size=SIZE):
    """Render a single line of text centered on a black background."""
    img = Image.new("RGB", (size, size), BG)
    draw = ImageDraw.Draw(img)
    font = ImageFont.truetype(FONT_PATH, 16 * SCALE)
    bbox = draw.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    x = (size - tw) // 2 - bbox[0]
    y = (size - th) // 2 - bbox[1]
    draw.text((x, y), text, font=font, fill=FG)
    return img


def render_block(size=SIZE):
    """Render a full character block (U+2588)."""
    img = Image.new("RGB", (size, size), BG)
    draw = ImageDraw.Draw(img)
    font = ImageFont.truetype(FONT_PATH, 16 * SCALE)
    bbox = draw.textbbox((0, 0), "\u2588", font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    x = (size - tw) // 2 - bbox[0]
    y = (size - th) // 2 - bbox[1]
    draw.text((x, y), "\u2588", font=font, fill=FG)
    return img


def render_empty(size=SIZE):
    return Image.new("RGB", (size, size), BG)


def main():
    blank = render_empty()
    n_frame = render_glyph("N")
    block = render_block()

    frames = []
    durations = []

    # Phase A: N -> blank -> block -> blank, repeated 3x
    for _ in range(3):
        frames += [n_frame, blank, block, blank]
        durations += [1000, 500, 1000, 500]

    # Phase B: spinner - \ | / each 20 ms for 3 seconds
    spinner_glyphs = ["-", "\\", "|", "/"]
    spinner_count = int(3000 / 20)  # 150 frames
    for i in range(spinner_count):
        frames.append(render_glyph(spinner_glyphs[i % 4]))
        durations.append(20)

    frames[0].save(
        OUT_PATH,
        save_all=True,
        append_images=frames[1:],
        duration=durations,
        loop=0,
        disposal=2,
    )
    print(f"Wrote {OUT_PATH} ({len(frames)} frames, "
          f"{sum(durations)}ms total)")

    n_frame.save(ICO_PATH, format="ICO", sizes=[(32, 32)])
    print(f"Wrote {ICO_PATH}")


if __name__ == "__main__":
    main()
