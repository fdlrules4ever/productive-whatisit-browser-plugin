"""Generate the extension icons (dev-only; requires Pillow).

Usage: python scripts/make-icons.py
"""
from pathlib import Path

from PIL import Image, ImageDraw

OUT = Path(__file__).resolve().parent.parent / "extension" / "icons"
SIZES = (16, 32, 48, 128)
S = 512  # draw large, downsample for crisp edges

BG = (46, 52, 120, 255)
FG = (255, 255, 255, 255)
ACCENT = (255, 196, 77, 255)


def draw() -> Image.Image:
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle((16, 16, S - 16, S - 16), radius=110, fill=BG)

    # Three dots: the ellipsis being "expanded".
    r = 38
    cy = S // 2
    for cx in (S // 2 - 110, S // 2, S // 2 + 110):
        d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=FG)

    # Outward chevrons left and right.
    w = 26
    d.line([(118, cy - 70), (62, cy), (118, cy + 70)], fill=ACCENT, width=w, joint="curve")
    d.line([(S - 118, cy - 70), (S - 62, cy), (S - 118, cy + 70)], fill=ACCENT, width=w, joint="curve")
    return img


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    big = draw()
    for size in SIZES:
        big.resize((size, size), Image.LANCZOS).save(OUT / f"icon-{size}.png")
    print(f"Wrote {len(SIZES)} icons to {OUT}")


if __name__ == "__main__":
    main()
