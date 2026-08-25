#!/usr/bin/env python3
"""
One-off dev script used to generate the local SVG placeholder images that
ship in /public/images/products and /public/images/hero + about.

These replace hotlinked placeholder-service URLs so the demo works fully
offline / behind restrictive firewalls with zero external image requests.
Re-run this if you add more demo products and want a matching placeholder
(then update the `image` path in data/products.ts to match).
"""
import os
import textwrap

PRODUCTS = [
    ("panadol-500mg", "Panadol 500mg"),
    ("augmentin-625mg", "Augmentin 625mg"),
    ("brufen-400mg", "Brufen 400mg"),
    ("flagyl-400mg", "Flagyl 400mg"),
    ("ors-rehydration-sachets", "ORS Sachets"),
    ("centrum-multivitamin-30", "Centrum Multivitamin"),
    ("vitamin-c-1000mg-effervescent", "Vitamin C 1000mg"),
    ("calcium-vitamin-d3-tablets", "Calcium + D3"),
    ("omega-3-fish-oil-capsules", "Omega-3 Fish Oil"),
    ("dettol-antiseptic-liquid-250ml", "Dettol 250ml"),
    ("sensodyne-toothpaste-100g", "Sensodyne 100g"),
    ("hand-sanitizer-500ml", "Hand Sanitizer"),
    ("johnsons-baby-shampoo-200ml", "Baby Shampoo"),
    ("pampers-diapers-size-3", "Pampers Size 3"),
    ("cetaphil-gentle-skin-cleanser", "Cetaphil Cleanser"),
    ("nivea-body-lotion-400ml", "Nivea Lotion"),
    ("digital-blood-pressure-monitor", "BP Monitor"),
    ("infrared-digital-thermometer", "Thermometer"),
    ("family-first-aid-kit", "First Aid Kit"),
    ("adhesive-bandages-box-100", "Bandages"),
    ("herbal-immunity-green-tea", "Green Tea"),
]

OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "public", "images", "products")
BG = "#dcf3e4"
FG = "#1c4d35"
ACCENT = "#8ed2aa"


def make_svg(label: str) -> str:
    lines = textwrap.wrap(label, width=16)[:3]
    line_height = 40
    start_y = 300 - (len(lines) - 1) * line_height / 2
    text_els = "\n".join(
        f'<text x="300" y="{start_y + i * line_height}" text-anchor="middle" '
        f'font-family="Arial, sans-serif" font-size="32" font-weight="700" fill="{FG}">{line}</text>'
        for i, line in enumerate(lines)
    )
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
  <rect width="600" height="600" fill="{BG}"/>
  <circle cx="300" cy="180" r="70" fill="{ACCENT}" opacity="0.5"/>
  <rect x="270" y="150" width="60" height="16" rx="8" fill="{FG}"/>
  <rect x="292" y="128" width="16" height="60" rx="8" fill="{FG}"/>
  {text_els}
  <text x="300" y="560" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="{FG}" opacity="0.6">Demo product image</text>
</svg>'''


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    for slug, label in PRODUCTS:
        path = os.path.join(OUT_DIR, f"{slug}.svg")
        with open(path, "w") as f:
            f.write(make_svg(label))
    print(f"Generated {len(PRODUCTS)} placeholder SVGs in {OUT_DIR}")


if __name__ == "__main__":
    main()
