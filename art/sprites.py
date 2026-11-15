#!/usr/bin/env python3
"""turns the brand logos in art/src into pixel sprites (rows of palette keys) -> art/sprites.json"""
import json
from pathlib import Path
from PIL import Image

SRC = Path(__file__).resolve().parent / "src"


def load(name, key_bg=False):
    img = Image.open(SRC / name).convert("RGBA")
    if key_bg:
        bg = img.getpixel((2, 2))[:3]
        px = img.load()
        for y in range(img.height):
            for x in range(img.width):
                r, g, b, _ = px[x, y]
                px[x, y] = (r, g, b, 0 if abs(r - bg[0]) + abs(g - bg[1]) + abs(b - bg[2]) < 26 else 255)
    return img


def sprite(img, w, palette, crop=True, resample=Image.BOX):
    if crop:
        img = img.crop(img.getbbox())
    h = max(1, round(w * img.height / img.width))
    px = img.resize((w * 4, h * 4), resample).load()
    pal = {k: tuple(int(v[i:i + 2], 16) for i in (1, 3, 5)) for k, v in palette.items()}
    rows = []
    for y in range(h):
        row = ""
        for x in range(w):
            votes, n = {}, 0
            for j in range(4):
                for i in range(4):
                    r, g, b, a = px[x * 4 + i, y * 4 + j]
                    if a < 110:
                        continue
                    n += 1
                    k = min(pal, key=lambda k: sum((p - q) ** 2 for p, q in zip(pal[k], (r, g, b))))
                    votes[k] = votes.get(k, 0) + 1
            row += max(votes, key=votes.get) if n >= 8 else "."
        rows.append(row)
    return rows


PIP = {"g": "#4daf4a", "d": "#3a8f3d", "w": "#fff5e0", "k": "#33312f", "l": "#8ad47f"}
out = {"palettes": {}}
box = load("pip-awake.png").getbbox()
for n in ("awake", "asleep", "looking", "pleased"):
    out[f"pip-{n}"] = sprite(load(f"pip-{n}.png").crop(box), 40, PIP, crop=False)
out["palettes"]["pip"] = PIP
out["strut"] = sprite(load("strut.png"), 74, {"o": "#1a1714"})
out["pixelforge"] = sprite(load("pixelforge.png"), 32, {"c": "#00ffff", "a": "#5cc8ff", "b": "#0a84ff", "d": "#0050e6"})
out["lucky"] = sprite(load("lucky.jpg", key_bg=True), 36, {"m": "#c9e8e2", "p": "#f6c9c9", "k": "#7f8a84", "g": "#c9d6bd", "w": "#ffffff"})
al = load("al.png")
al = al.crop((0, 0, int(al.height * 1.78), al.height))
out["al"] = sprite(al, 40, {"w": "#f1fef3", "g": "#2fc062"})

(Path(__file__).resolve().parent / "sprites.json").write_text(json.dumps(out))
for k, v in out.items():
    if k != "palettes":
        print(k, len(v[0]), "x", len(v))
