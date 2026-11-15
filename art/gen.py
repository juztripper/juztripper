#!/usr/bin/env python3
"""ascii profile art. every logo in art/src is rasterized into characters,
kept in its own brand colours, and written as an animated svg into assets/.

    pip install pillow && python3 art/gen.py
"""
import base64
import random
from pathlib import Path
from xml.sax.saxutils import escape

from PIL import Image

ROOT = Path(__file__).resolve().parent
SRC = ROOT / "src"
OUT = ROOT.parent / "assets"

# grid
FS, CW, LH = 14, 8.4, 17
# ripper's games tokens
BG, INK, DIM, FAINT, LINE, OPAL = "#0d0d0c", "#ede7e1", "#a29c94", "#8d867c", "#3b3a36", "#a9dde4"

FONT = base64.b64encode((SRC / "jbm.woff2").read_bytes()).decode()


# ---------------------------------------------------------------- canvas --
class Layer:
    """a grid of (char, colour). layers stack and animate independently."""

    def __init__(self, cols, rows, cls="", style=""):
        self.cols, self.rows, self.cls, self.style = cols, rows, cls, style
        self.g = [[None] * cols for _ in range(rows)]

    def put(self, col, row, text, color=INK):
        for i, ch in enumerate(text):
            if 0 <= col + i < self.cols and 0 <= row < self.rows and ch != " ":
                self.g[row][col + i] = (ch, color)
        return self

    def blit(self, cells, col, row):
        for r, line in enumerate(cells):
            for c, cell in enumerate(line):
                if cell and 0 <= row + r < self.rows and 0 <= col + c < self.cols:
                    self.g[row + r][col + c] = cell
        return self

    def svg(self, px, py):
        out = []
        for r, line in enumerate(self.g):
            c = 0
            while c < self.cols:
                if not line[c]:
                    c += 1
                    continue
                color = line[c][1]
                s = c
                txt = ""
                # a run may span single gaps so words stay one element
                while c < self.cols and (
                    (line[c] and line[c][1] == color)
                    or (not line[c] and c + 1 < self.cols and line[c + 1] and line[c + 1][1] == color)
                ):
                    txt += line[c][0] if line[c] else " "
                    c += 1
                x = round(px + s * CW, 2)
                y = round(py + r * LH + 12, 2)
                tl = f' textLength="{round(len(txt) * CW, 2)}"' if len(txt) > 1 else ""
                out.append(f'<text x="{x}" y="{y}" fill="{color}"{tl}>{escape(txt)}</text>')
        attrs = (f' class="{self.cls}"' if self.cls else "") + (f' style="{self.style}"' if self.style else "")
        return f"<g{attrs}>{''.join(out)}</g>"


def document(cols, rows, layers, css="", extra="", title="", cut=False):
    w = 880 if cols >= 90 else 434
    px = (w - cols * CW) / 2
    py = 18
    h = round(rows * LH + py * 2)
    if cut:
        k = 22
        shape = f'<path d="M{k} .5H{w - .5}V{h - k}L{w - k} {h - .5}H.5V{k}Z" fill="{BG}" stroke="{LINE}"/>'
    else:
        shape = f'<rect x=".5" y=".5" width="{w - 1}" height="{h - 1}" fill="{BG}" stroke="{LINE}"/>'
    body = "".join(l.svg(px, py) for l in layers)
    base = f"""
@font-face{{font-family:"JBM";src:url(data:font/woff2;base64,{FONT}) format("woff2")}}
text{{font:{FS}px "JBM",ui-monospace,"SF Mono",Menlo,Consolas,monospace;white-space:pre}}
.show{{opacity:0;animation:show .01s linear forwards}}
@keyframes show{{to{{opacity:1}}}}
.flash{{opacity:0;animation:flash .16s linear}}
@keyframes flash{{0%,100%{{opacity:1}}}}
.blink{{animation:blink 1.1s steps(1) infinite}}
@keyframes blink{{50%{{opacity:0}}}}
.wave{{opacity:0;animation:wave 7s linear infinite}}
@keyframes wave{{0%,6%,100%{{opacity:0}}2%,3.5%{{opacity:1}}}}
.type{{transform-box:fill-box;transform-origin:100% 50%;animation:type var(--d,.6s) steps(var(--n)) var(--t,0s) forwards}}
@keyframes type{{to{{transform:scaleX(0)}}}}
.cur{{opacity:0;animation:cur 1.1s steps(1) infinite}}
@keyframes cur{{0%,49%{{opacity:1}}50%,100%{{opacity:0}}}}
@media (prefers-reduced-motion:reduce){{*{{animation-duration:.01s!important;animation-delay:0s!important;animation-iteration-count:1!important}}.wave,.flash{{display:none}}}}
"""
    svg = (
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}" role="img" aria-label="{escape(title)}">'
        f"<title>{escape(title)}</title><style>{base}{css}</style>{shape}"
        f'<g xml:space="preserve">{body}</g>{extra.replace("{PX}", str(px)).replace("{PY}", str(py))}</svg>\n'
    )
    return svg, px, py


def typer(px, py, col, row, n, t, d=None):
    """a ground-coloured cover that steps off the text: a typing effect that needs no js."""
    d = d or round(n * 0.045, 2)
    x, y, w = round(px + col * CW, 2), round(py + row * LH - 2, 2), round(n * CW + 2, 2)
    return f'<rect class="type" x="{x}" y="{y}" width="{w}" height="{LH + 1}" fill="{BG}" style="--n:{n};--w:{w}px;--t:{t}s;--d:{d}s"/>'


# ---------------------------------------------------------- rasterizing --
def load(name, key_bg=False):
    img = Image.open(SRC / name).convert("RGBA")
    if key_bg:  # flat background -> alpha
        bg = img.getpixel((2, 2))[:3]
        px = img.load()
        for y in range(img.height):
            for x in range(img.width):
                r, g, b, _ = px[x, y]
                d = abs(r - bg[0]) + abs(g - bg[1]) + abs(b - bg[2])
                px[x, y] = (r, g, b, 0 if d < 26 else 255)
    return img.crop(img.getbbox())


def nearest(rgb, palette):
    return min(palette, key=lambda p: sum((a - b) ** 2 for a, b in zip(rgb, p)))


def hexrgb(h):
    return tuple(int(h[i : i + 2], 16) for i in (1, 3, 5))


def ascii_cells(img, cols, classes, rows=None):
    """classes: {source hex: (output hex, fill char)}. each cell takes the class most of
    its pixels vote for, and a lighter char when the cell is only partly covered."""
    sx, sy = 4, 8
    if rows is None:
        rows = max(1, round(cols * CW * img.height / img.width / LH))
    small = img.resize((cols * sx, rows * sy), Image.LANCZOS)
    px = small.load()
    pal = [hexrgb(h) for h in classes]
    out = []
    for r in range(rows):
        line = []
        for c in range(cols):
            votes, top, bot, left, right = {}, 0, 0, 0, 0
            for y in range(sy):
                for x in range(sx):
                    R, G, B, A = px[c * sx + x, r * sy + y]
                    if A < 90:
                        continue
                    k = nearest((R, G, B), pal)
                    votes[k] = votes.get(k, 0) + 1
                    if y < sy // 2:
                        top += 1
                    else:
                        bot += 1
                    if x < sx // 2:
                        left += 1
                    else:
                        right += 1
            n = sx * sy
            cov = (top + bot) / n
            if cov < 0.2:
                line.append(None)
                continue
            k = max(votes, key=votes.get)
            color, fill = classes["#%02x%02x%02x" % k]
            t, b = top / (n / 2), bot / (n / 2)
            if cov >= 0.5:
                ch = fill
            elif t - b > 0.3:
                ch = '"'
            elif b - t > 0.3:
                ch = ","
            else:
                ch = ":"
            line.append((ch, color))
        out.append(line)
    return out


def recolor(cells, color):
    return [[(c[0], color) if c else None for c in line] for line in cells]


def scramble(cells, keep, seed, color):
    rnd = random.Random(seed)
    junk = "01/\\<>{}[]#$%&=+*"
    return [[((c[0] if rnd.random() < keep else rnd.choice(junk)), color) if c else None for c in line] for line in cells]


def bands(layers, cells, col, row, cols, rows, color, n=14, period=7.0, t0=2.5):
    """a highlight that walks across the art: the same cells again in another colour,
    cut into vertical bands that light up one after the other."""
    width = len(cells[0])
    step = max(1, -(-width // n))
    for i in range(0, width, step):
        l = Layer(cols, rows, "wave", f"animation-delay:{round(t0 + (i / step) * 0.07, 2)}s;animation-duration:{period}s")
        l.blit([[c if i <= x < i + step else None for x, c in enumerate(line)] for line in recolor(cells, color)], col, row)
        layers.append(l)


def frame(layer, cols, rows, title, tcolor, tag="", tagcolor=FAINT):
    top = "+-- " + title + " " + "-" * (cols - len(title) - 6 - (len(tag) + 2 if tag else 0)) + ((" " + tag + " ") if tag else "") + "+"
    top = top[: cols - 1].ljust(cols - 1, "-") + "+" if len(top) != cols else top
    layer.put(0, 0, top, LINE)
    layer.put(4, 0, title, tcolor)
    if tag:
        layer.put(cols - len(tag) - 2, 0, tag, tagcolor)
    for r in range(1, rows - 1):
        layer.put(0, r, "|", LINE)
        layer.put(cols - 1, r, "|", LINE)
    layer.put(0, rows - 1, "+" + "-" * (cols - 2) + "+", LINE)


def wrap(text, width):
    lines, cur = [], ""
    for word in text.split():
        if len(cur) + len(word) + 1 > width and cur:
            lines.append(cur)
            cur = word
        else:
            cur = (cur + " " + word).strip()
    return lines + [cur]


# ------------------------------------------------------------------ hero --
def hero():
    cols, rows = 100, 27
    PROMPT = "ripper@rippers-games:~$ "
    layers, extra = [], []
    base = Layer(cols, rows)
    base.put(1, 1, PROMPT, FAINT).put(1 + len(PROMPT), 1, "whoami", INK)

    word = ascii_cells(load("ripper.png"), 76, {"#ffffff": (INK, "#")})
    wc, wr = (cols - 76) // 2, 3
    for i, keep in enumerate((0.15, 0.45, 0.75)):
        layers.append(Layer(cols, rows, "flash", f"animation-delay:{0.9 + i * 0.16}s").blit(scramble(word, keep, i, FAINT), wc, wr))
    final = Layer(cols, rows, "show", "animation-delay:1.38s").blit(word, wc, wr)
    layers.append(final)
    bands(layers, word, wc, wr, cols, rows, OPAL, n=19, period=8, t0=3.2)

    r = wr + len(word) + 1
    tag = "i don't play games. i make them."
    line = Layer(cols, rows, "show", "animation-delay:1.7s").put((cols - len(tag)) // 2, r, tag, INK)
    layers.append(line)

    info = [
        ("studio", "ripper's games", "building", "build a brick set"),
        ("based", "portugal", "shipping", "pixelforge"),
        ("coding", "since i was 9", "designing", "strut"),
        ("peak", "7,000 players, one game", "sleeping", "rarely"),
    ]
    r += 2
    for i, (k1, v1, k2, v2) in enumerate(info):
        l = Layer(cols, rows, "show", f"animation-delay:{2.5 + i * 0.12}s")
        l.put(14, r + i, k1, OPAL).put(24, r + i, v1, DIM).put(56, r + i, k2, OPAL).put(68, r + i, v2, DIM)
        layers.append(l)
    r += len(info) + 1
    layers.append(Layer(cols, rows, "show", "animation-delay:3.1s").put(1, r, PROMPT, FAINT))
    layers.append(Layer(cols, rows, "cur", "animation-delay:3.1s").put(1 + len(PROMPT), r, "_", OPAL))
    rows = r + 2
    for l in [base] + layers:
        l.rows = rows
        l.g = l.g[:rows]
    svg, px, py = document(cols, rows, [base] + layers, title="ripper. i don't play games. i make them. solo studio ripper's games, portugal. building build a brick set, shipping pixelforge, designing strut.", cut=True)
    covers = typer(px, py, 1 + len(PROMPT), 1, 6, 0.35) + typer(px, py, (cols - len(tag)) // 2, wr + len(word) + 1, len(tag), 1.75, 0.9)
    return svg.replace("</svg>", covers + "</svg>")


# ------------------------------------------------------ build a brick set --
PIP = {"#4daf4a": ("#4DAF4A", "#"), "#3a8f3d": ("#3a8f3d", "%"), "#fff5e0": ("#FFF5E0", "@"), "#33312f": ("#b9ad98", "+"), "#8ad47f": ("#8ad47f", "#")}


def brickset():
    cols, rows = 100, 20
    base = Layer(cols, rows)
    YEL, GRN, KRAFT = "#FAC834", "#4DAF4A", "#C9A06E"
    frame(base, cols, rows, "build a brick set", YEL, "main project", KRAFT)
    layers = [base]
    pc, pr, pw = 5, 2, 32
    frames = {n: ascii_cells(load(f"pip-{n}.png"), pw, PIP) for n in ("awake", "looking", "asleep", "pleased")}
    css = """
.pa{animation:pa 9s steps(1) infinite}.pl{opacity:0;animation:pl 9s steps(1) infinite}
.ps{opacity:0;animation:ps 9s steps(1) infinite}.pp{opacity:0;animation:pp 9s steps(1) infinite}
@keyframes pa{0%{opacity:1}30%{opacity:0}46%{opacity:1}60%{opacity:0}63%{opacity:1}78%{opacity:0}96%{opacity:1}}
@keyframes pl{0%{opacity:0}30%{opacity:1}46%{opacity:0}}
@keyframes ps{0%{opacity:0}60%{opacity:1}63%{opacity:0}}
@keyframes pp{0%{opacity:0}78%{opacity:1}96%{opacity:0}}
"""
    for n, cls in (("awake", "pa"), ("looking", "pl"), ("asleep", "ps"), ("pleased", "pp")):
        layers.append(Layer(cols, rows, cls).blit(frames[n], pc, pr))

    x = 44
    t = Layer(cols, rows)
    t.put(x, 3, "BUILD A BRICK SET", YEL)
    t.put(x, 5, "open the box. tear the bags.", INK)
    t.put(x, 6, "press every piece on.", INK)
    t.put(x, 8, "a calm roblox game about building boxed brick sets", DIM)
    t.put(x, 9, "by hand. no timers. nothing to lose. phones first.", DIM)
    t.put(x, 13, "set 001", FAINT).put(x + 9, 13, "mailbox", INK).put(x + 18, 13, "44 pieces, 2 numbers", DIM)
    t.put(x, 14, "stack", FAINT).put(x + 9, 14, "roblox, luau, rojo, blender", DIM)
    t.put(x, 16, "status", FAINT).put(x + 9, 16, "[" + "." * 26 + "]", LINE).put(x + 38, 16, "in development", KRAFT)
    layers.append(t)
    # pip speaks, then the bar fills one piece at a time
    quote = '> "bag 1 first. i\'ll wait."'
    layers.append(Layer(cols, rows).put(x, 11, quote, GRN).put(x + len(quote) + 2, 11, "pip", FAINT))
    filled = 17
    for i in range(filled):
        layers.append(Layer(cols, rows, "pc", f"animation-delay:{round(1.2 + i * 0.22, 2)}s").put(x + 10 + i, 16, "#", YEL))
    css += ".pc{opacity:0;animation:pc 12s steps(1) infinite}@keyframes pc{0%{opacity:0}2%,92%{opacity:1}100%{opacity:0}}"
    svg, px, py = document(cols, rows, layers, css=css, title="build a brick set, my main project. a calm roblox game: open the box, tear the bags, press every piece on. in development.")
    cover = typer(px, py, x, 11, len(quote), 0.8, 1.1)
    return svg.replace("</svg>", cover + "</svg>")


# ----------------------------------------------------------------- cards --
def card(name, color, tag, logo, logo_cols, text, meta, hi="#ffffff", logo_at=None, post=None):
    cols, rows = 46, 17
    base = Layer(cols, rows)
    frame(base, cols, rows, name, color, tag)
    layers = [base]
    lc = logo_at if logo_at is not None else (cols - len(logo[0])) // 2
    lr = 2 + max(0, (7 - len(logo)) // 2)
    layers.append(Layer(cols, rows).blit(logo, lc, lr))
    bands(layers, logo, lc, lr, cols, rows, hi, n=10, period=7, t0=1.5 + random.Random(name).random() * 3)
    t = Layer(cols, rows)
    for i, l in enumerate(wrap(text, cols - 6)):
        t.put(3, 10 + i, l, DIM)
    t.put(3, rows - 3, meta, FAINT)
    layers.append(t)
    css = ""
    if post:
        css = post(layers, cols, rows) or ""
    svg, _, _ = document(cols, rows, layers, css=css, title=f"{name}: {text} ({tag})")
    return svg


def strut():
    logo = ascii_cells(load("strut.png"), 40, {"#1a1714": ("#F0532B", "#")}, rows=6)
    return card("strut", "#F0532B", "in development", logo, 36,
                "an ai wardrobe for the closet you already own. outfits from your clothes, the weather and your day.",
                "android, kotlin, compose", hi="#FAF8F5")


def pixelforge():
    src = load("pixelforge.png")
    classes = {"#00ffff": ("#22e0ff", "+"), "#5cc8ff": ("#5cc8ff", "#"), "#0a84ff": ("#2f8cff", "%"), "#0050e6": ("#1f5fe0", "@")}
    cube = ascii_cells(src, 14, classes)
    word = [[(ch, "#ede7e1" if i < 5 else "#2f8cff") for i, ch in enumerate("PixelForge")]]

    def post(layers, cols, rows):
        l = Layer(cols, rows)
        l.blit(word, 24, 4)
        l.put(24, 5, "icon tool", FAINT)
        layers.append(l)

    return card("pixelforge", "#2f8cff", "live", cube, 18,
                "a roblox studio plugin that turns any model into a clean icon. sold on itch.io and the creator store.",
                "roblox studio plugin, luau", hi="#c9f4ff", logo_at=5, post=post)


def lucky():
    src = load("lucky.jpg", key_bg=True)
    classes = {"#c9e8e2": ("#bfe3dc", "#"), "#f6c9c9": ("#f3bfc0", "@"), "#7f8a84": ("#8f9a94", "+"), "#c9d6bd": ("#c5d4b6", "%"), "#ffffff": ("#f3ece4", ":")}
    logo = ascii_cells(src, 15, classes)

    def post(layers, cols, rows):
        l = Layer(cols, rows)
        l.put(24, 4, "Lucky Baby Bow", "#f3bfc0")
        l.put(24, 5, "papelaria", FAINT)
        layers.append(l)
        for i, (c, r) in enumerate(((21, 2), (42, 2), (40, 7), (22, 8))):
            layers.append(Layer(cols, rows, "tw", f"animation-delay:{i * 0.9}s").put(c, r, "*", "#bfe3dc"))
        return ".tw{opacity:0;animation:tw 3.6s ease-in-out infinite}@keyframes tw{0%,60%,100%{opacity:0}30%{opacity:1}}"

    return card("lucky baby bow", "#f3bfc0", "live", logo, 18,
                "website and desktop app for a custom stationery shop in portugal.",
                "web, electron, typescript", hi="#ffffff", logo_at=4, post=post)


def looked():
    src = load("al.png")
    src = src.crop((0, 0, int(src.height * 1.78), src.height))  # the A/L monogram
    src = src.crop(src.getbbox())
    logo = ascii_cells(src, 22, {"#f1fef3": ("#f1fef3", "#"), "#2fc062": ("#2fc062", "/")})

    def post(layers, cols, rows):
        l = Layer(cols, rows)
        l.put(28, 4, "ALREADY", "#f1fef3").put(28, 5, "/LOOKED", "#f1fef3").put(28, 5, "/", "#2fc062")
        l.put(28, 7, "says what it", FAINT).put(28, 8, "couldn't see.", FAINT)
        layers.append(l)

    return card("already looked", "#2fc062", "open source", logo, 22,
                "two skills for coding agents: one names things and checks they're free, one builds the brand.",
                "agent skills, npx skills add", hi="#2fc062", logo_at=4, post=post)


# ---------------------------------------------------------------- footer --
def footer():
    cols, rows = 100, 12
    PROMPT = "ripper@rippers-games:~$ "
    p = len(PROMPT) + 1
    base = Layer(cols, rows)
    cmds = [(1, "ls ~/toolbox"), (4, "sed 's/reaper/ripper/' name.txt"), (7, "cat links.txt")]
    for r, c in cmds:
        base.put(1, r, PROMPT, FAINT).put(p, r, c, INK)
    layers = [base]
    tools = ["unity", "roblox-studio", "luau", "rojo", "blender", "kotlin", "swiftui", "typescript", "python", "claude-code"]
    l = Layer(cols, rows, "show", "animation-delay:1.1s")
    x = 1
    for i, t in enumerate(tools):
        l.put(x, 2, t, OPAL if i % 2 == 0 else DIM)
        x += len(t) + 2
    layers.append(l)
    l = Layer(cols, rows, "show", "animation-delay:3.2s")
    l.put(1, 5, "ripper", INK).put(10, 5, "# it was meant to be reaper btw", FAINT)
    layers.append(l)
    l = Layer(cols, rows, "show", "animation-delay:4.5s")
    l.put(1, 8, "web", OPAL).put(7, 8, "rippersgames.com", DIM)
    l.put(30, 8, "x", OPAL).put(34, 8, "@juztripper", DIM)
    l.put(52, 8, "itch", OPAL).put(59, 8, "juztripper.itch.io", DIM)
    layers.append(l)
    layers.append(Layer(cols, rows, "show", "animation-delay:4.8s").put(1, 10, PROMPT, FAINT))
    layers.append(Layer(cols, rows, "cur", "animation-delay:4.8s").put(p, 10, "_", OPAL))
    svg, px, py = document(cols, rows, layers, title="toolbox: unity, roblox studio, luau, rojo, blender, kotlin, swiftui, typescript, python, claude code. it was meant to be reaper btw.", cut=True)
    covers = typer(px, py, p, 1, len(cmds[0][1]), 0.4) + typer(px, py, p, 4, len(cmds[1][1]), 1.6, 1.3) + typer(px, py, p, 7, len(cmds[2][1]), 3.7)
    return svg.replace("</svg>", covers + "</svg>")


if __name__ == "__main__":
    OUT.mkdir(exist_ok=True)
    for name, fn in {"hero": hero, "brickset": brickset, "strut": strut, "pixelforge": pixelforge, "lucky": lucky, "looked": looked, "footer": footer}.items():
        (OUT / f"{name}.svg").write_text(fn())
        print(name, f"{(OUT / f'{name}.svg').stat().st_size / 1024:.0f}kb")
