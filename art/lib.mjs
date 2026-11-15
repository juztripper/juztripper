// shared bits for the profile art: palette, a hand-made 5x7 pixel font, svg helpers.
// everything is drawn with rects/paths so it renders the same everywhere (no web fonts in readme images).

export const C = {
  night: '#070c22',
  deep: '#0b1433',
  glazeDark: '#101b44',
  cobaltDeep: '#16296b',
  cobalt: '#2447a8',
  cobaltMid: '#3b67d1',
  sky: '#7fa4ef',
  ice: '#c9d9fb',
  glaze: '#f3eee2',
  ochre: '#e7a83a',
  ochreDeep: '#b97a1c',
  terra: '#c8532f',
  red: '#d7343f',
};

const G = {
  A: ['.###.', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  B: ['####.', '#...#', '#...#', '####.', '#...#', '#...#', '####.'],
  C: ['.###.', '#...#', '#....', '#....', '#....', '#...#', '.###.'],
  D: ['####.', '#...#', '#...#', '#...#', '#...#', '#...#', '####.'],
  E: ['#####', '#....', '#....', '####.', '#....', '#....', '#####'],
  F: ['#####', '#....', '#....', '####.', '#....', '#....', '#....'],
  G: ['.###.', '#...#', '#....', '#.###', '#...#', '#...#', '.###.'],
  H: ['#...#', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  I: ['###', '.#.', '.#.', '.#.', '.#.', '.#.', '###'],
  J: ['..###', '...#.', '...#.', '...#.', '...#.', '#..#.', '.##..'],
  K: ['#...#', '#..#.', '#.#..', '##...', '#.#..', '#..#.', '#...#'],
  L: ['#....', '#....', '#....', '#....', '#....', '#....', '#####'],
  M: ['#...#', '##.##', '#.#.#', '#.#.#', '#...#', '#...#', '#...#'],
  N: ['#...#', '#...#', '##..#', '#.#.#', '#..##', '#...#', '#...#'],
  O: ['.###.', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  P: ['####.', '#...#', '#...#', '####.', '#....', '#....', '#....'],
  Q: ['.###.', '#...#', '#...#', '#...#', '#.#.#', '#..#.', '.##.#'],
  R: ['####.', '#...#', '#...#', '####.', '#.#..', '#..#.', '#...#'],
  S: ['.####', '#....', '#....', '.###.', '....#', '....#', '####.'],
  T: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..'],
  U: ['#...#', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  V: ['#...#', '#...#', '#...#', '#...#', '#...#', '.#.#.', '..#..'],
  W: ['#...#', '#...#', '#...#', '#.#.#', '#.#.#', '#.#.#', '.#.#.'],
  X: ['#...#', '#...#', '.#.#.', '..#..', '.#.#.', '#...#', '#...#'],
  Y: ['#...#', '#...#', '.#.#.', '..#..', '..#..', '..#..', '..#..'],
  Z: ['#####', '....#', '...#.', '..#..', '.#...', '#....', '#####'],
  0: ['.###.', '#...#', '#..##', '#.#.#', '##..#', '#...#', '.###.'],
  1: ['.#.', '##.', '.#.', '.#.', '.#.', '.#.', '###'],
  2: ['.###.', '#...#', '....#', '...#.', '..#..', '.#...', '#####'],
  3: ['####.', '....#', '....#', '.###.', '....#', '....#', '####.'],
  4: ['...#.', '..##.', '.#.#.', '#..#.', '#####', '...#.', '...#.'],
  5: ['#####', '#....', '####.', '....#', '....#', '#...#', '.###.'],
  6: ['.###.', '#....', '#....', '####.', '#...#', '#...#', '.###.'],
  7: ['#####', '....#', '...#.', '..#..', '.#...', '.#...', '.#...'],
  8: ['.###.', '#...#', '#...#', '.###.', '#...#', '#...#', '.###.'],
  9: ['.###.', '#...#', '#...#', '.####', '....#', '....#', '.###.'],
  '.': ['.', '.', '.', '.', '.', '.', '#'],
  ',': ['..', '..', '..', '..', '..', '.#', '#.'],
  '!': ['#', '#', '#', '#', '#', '.', '#'],
  '?': ['.###.', '#...#', '....#', '...#.', '..#..', '.....', '..#..'],
  "'": ['#', '#', '.', '.', '.', '.', '.'],
  '-': ['...', '...', '...', '###', '...', '...', '...'],
  ':': ['.', '.', '#', '.', '.', '#', '.'],
  '/': ['....#', '...#.', '...#.', '..#..', '.#...', '.#...', '#....'],
  '&': ['.##..', '#..#.', '#.#..', '.#...', '#.#.#', '#..#.', '.##.#'],
  '+': ['.....', '..#..', '..#..', '#####', '..#..', '..#..', '.....'],
  '>': ['#...', '.#..', '..#.', '...#', '..#.', '.#..', '#...'],
  '<': ['...#', '..#.', '.#..', '#...', '.#..', '..#.', '...#'],
  '(': ['..#', '.#.', '#..', '#..', '#..', '.#.', '..#'],
  ')': ['#..', '.#.', '..#', '..#', '..#', '.#.', '#..'],
  '·': ['.', '.', '.', '#', '.', '.', '.'],
  '#': ['.#.#.', '.#.#.', '#####', '.#.#.', '#####', '.#.#.', '.#.#.'],
  '*': ['.....', '..#..', '#.#.#', '.###.', '#.#.#', '..#..', '.....'],
  '♥': ['.....', '.#.#.', '#####', '#####', '.###.', '..#..', '.....'],
  '★': ['..#..', '..#..', '#####', '.###.', '.#.#.', '#...#', '.....'],
  '→': ['.....', '...#.', '....#', '#####', '....#', '...#.', '.....'],
  É: ['...#.', '..#..', '#####', '#....', '#....', '####.', '#....', '#....', '#####'],
  Á: ['...#.', '..#..', '.###.', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  Ç: ['.###.', '#...#', '#....', '#....', '#....', '#...#', '.###.', '..#..', '.#...'],
};
const SPACE = 3;

export function glyph(ch) {
  const g = G[ch] ?? G[ch.toUpperCase()];
  if (!g) {
    if (ch === ' ') return { w: SPACE, rows: [] };
    throw new Error(`no glyph for ${JSON.stringify(ch)}`);
  }
  // 9-row glyphs carry 2 rows above the cap height (accents); cedilla goes below instead.
  const top = g.length === 9 && ch !== 'Ç' && ch !== 'ç' ? -2 : 0;
  return { w: g[0].length, rows: g, top };
}

export function textWidth(str, s = 1, gap = 1) {
  let w = 0;
  const chars = [...str];
  chars.forEach((ch, i) => {
    w += glyph(ch).w;
    if (i < chars.length - 1) w += gap;
  });
  return w * s;
}

// path data for one glyph at (x,y) with pixel size s. merges horizontal runs.
export function glyphPath(ch, x, y, s) {
  const { rows, top } = glyph(ch);
  let d = '';
  rows.forEach((row, r) => {
    let c = 0;
    while (c < row.length) {
      if (row[c] === '#') {
        let e = c;
        while (e < row.length && row[e] === '#') e++;
        d += `M${r2(x + c * s)} ${r2(y + (r + top) * s)}h${r2((e - c) * s)}v${r2(s)}h${r2(-(e - c) * s)}z`;
        c = e;
      } else c++;
    }
  });
  return d;
}

// returns [{ch, x, d}] per glyph, so callers can animate letters individually.
export function textGlyphs(str, x, y, s = 1, gap = 1) {
  const out = [];
  let cx = x;
  for (const ch of [...str]) {
    const { w } = glyph(ch);
    out.push({ ch, x: cx, w: w * s, d: glyphPath(ch, cx, y, s) });
    cx += (w + gap) * s;
  }
  return out;
}

export function textPath(str, x, y, s = 1, gap = 1) {
  return textGlyphs(str, x, y, s, gap).map((g) => g.d).join('');
}

// anchor helpers
export function textAt(str, { x, y, s = 1, gap = 1, anchor = 'start', fill, extra = '' }) {
  const w = textWidth(str, s, gap);
  const sx = anchor === 'middle' ? x - w / 2 : anchor === 'end' ? x - w : x;
  return `<path d="${textPath(str, Math.round(sx / s) * s, y, s, gap)}" fill="${fill}" ${extra}/>`;
}

// draw a bitmap given as rows of chars, with a char->color map. '.' or ' ' = transparent.
export function bitmap(rows, x, y, s, colors) {
  const byColor = {};
  rows.forEach((row, r) => {
    let c = 0;
    while (c < row.length) {
      const k = row[c];
      if (k === '.' || k === ' ' || !colors[k]) {
        c++;
        continue;
      }
      let e = c;
      while (e < row.length && row[e] === k) e++;
      (byColor[k] ??= []).push(`M${r2(x + c * s)} ${r2(y + r * s)}h${r2((e - c) * s)}v${r2(s)}h${r2(-(e - c) * s)}z`);
      c = e;
    }
  });
  return Object.entries(byColor)
    .map(([k, ds]) => `<path d="${ds.join('')}" fill="${colors[k]}"/>`)
    .join('');
}

export function r2(n) {
  return Math.round(n * 100) / 100;
}

// tiny deterministic rng so builds are reproducible
export function rng(seed = 7) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function svg(w, h, body, { title = '', defs = '', style = '' } = {}) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(title)}" shape-rendering="crispEdges">
<title>${esc(title)}</title>
<defs>${defs}</defs>
<style>${style}</style>
${body}
</svg>
`;
}

export function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// a pixel azulejo: 4x4 quadrant mirrored into 8x8. keys: 0 glaze, 1 cobalt, 2 sky, 3 ochre
export function mirrorTile(q) {
  const n = q.length * 2;
  const full = [];
  for (let r = 0; r < n; r++) {
    let row = '';
    for (let c = 0; c < n; c++) row += q[Math.min(r, n - 1 - r)][Math.min(c, n - 1 - c)];
    full.push(row);
  }
  return full;
}

export const TILES = {
  flower: mirrorTile(['2001', '0010', '0131', '1013']),
  lattice: mirrorTile(['1100', '1000', '0022', '0021']),
  star: mirrorTile(['0010', '0110', '1103', '0033']),
  // the big one: a 16x16 portuguese-style rosette tile
  rosette: mirrorTile(['22100001', '21000012', '10000012', '00020012', '00002001', '00000111', '01110133', '12221133']),
};

// the caravel, our mascot. r = sail red cross, w = sail, b = hull, d = hull dark, m = mast/rope, f = flag, y = trim
export const CARAVEL = [
  '..........f...........',
  '..........ff..........',
  '..........m...........',
  '.....wwwwwmwwwww......',
  '....wwwwwwmwwwwww.....',
  '....wwwwwrmrwwwww.....',
  '...wwwwwwrmrwwwwww....',
  '...wwwrrrrmrrrrwww....',
  '...wwwrrrrmrrrrwww....',
  '...wwwwwwrmrwwwwww..m.',
  '....wwwwwrmrwwwww..mw.',
  '....wwwwwwmwwwwww.mww.',
  '.....wwwwwmwwwww.mwww.',
  '..........m......mwww.',
  'y.........m.....mwwww.',
  'yy........m.........m.',
  'bbbbbbbbbbbbbbbbbbbbbb',
  '.yyyyyyyyyyyyyyyyyyyy.',
  '..bbbbbbbbbbbbbbbbbbb.',
  '...ddddddddddddddddd..',
  '.....ddddddddddddd....',
];
