// project cartridges: one svg per project, styled like a game cart with box art.
import { C, TILES, svg, bitmap, textAt, textWidth, r2 } from './lib.mjs';

const W = 432;
const H = 260;

// add a 1px dark outline around every painted cell
function outline(rows, key = 'k') {
  const h = rows.length;
  const w = Math.max(...rows.map((r) => r.length));
  const grid = rows.map((r) => r.padEnd(w, '.').split(''));
  const out = grid.map((r) => r.slice());
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      if (grid[y][x] !== '.') continue;
      const n = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => grid[y + dy]?.[x + dx] && grid[y + dy][x + dx] !== '.');
      if (n) out[y][x] = key;
    }
  return out.map((r) => r.join(''));
}

// procedural icons where geometry is easier than hand pixels
function icon(fn, n = 16) {
  const rows = [];
  for (let y = 0; y < n; y++) {
    let row = '';
    for (let x = 0; x < n; x++) row += fn(x + 0.5, y + 0.5) ?? '.';
    rows.push(row);
  }
  return rows;
}

const ICONS = {
  yarn: outline(
    icon((x, y) => {
      // two knitting needles behind the ball
      if (x > 4 && y < 9 && Math.abs(x - 2 * (8 - y) - 4) < 0.8 && x < 15) return 'a';
      if (x > 9 && y < 9 && Math.abs(16 - x - 2 * (8 - y) + 4) < 0.8) return 'a';
      const d = Math.hypot(x - 7, y - 9);
      if (d < 5.8) {
        const arc = Math.hypot(x - 1, y - 15) % 2.6;
        return arc < 0.9 ? 'b' : 'w';
      }
      if (y > 13.5 && x > 9 && y < 15.5 && Math.abs(y - 14.5 - Math.sin(x * 1.1) * 0.6) < 0.6) return 'b';
      return null;
    }),
  ),
  noslop: icon((x, y) => {
    const d = Math.hypot(x - 8, y - 8);
    if (d > 6 && d < 8) return 'r';
    if (d <= 6 && Math.abs(x - y) < 1.2) return 'r';
    if (d <= 6 && [5, 8, 11].some((wy) => Math.abs(y - wy - Math.sin(x * 1.3) * 0.9) < 0.6)) return 'b';
    if (d <= 6) return 'w';
    return null;
  }),
  eye: outline(
    icon((x, y) => {
      const t = (x - 8) / 7.6;
      const half = 5.2 * (1 - t * t);
      if (Math.abs(y - 8) > half) return null;
      const d = Math.hypot(x - 8, y - 8);
      if (d < 1.6) return 'k';
      if (d < 2.4 && x < 8 && y < 8) return 'w';
      if (d < 3.6) return 'a';
      if (d < 4.4) return 'b';
      return 'w';
    }),
  ),
  anvil: outline([
    '................',
    '.......a..a.....',
    '....a...aa...a..',
    '......a.aa.a....',
    '................',
    '.wwwwwwwwwwwwww.',
    '..wwwwwwwwwwwww.',
    '....wwwwwwwwww..',
    '.......wwww.....',
    '.......wwww.....',
    '......wwwwww....',
    '.....wwwwwwww...',
    '.....bbbbbbbb...',
    '................',
  ]),
  robot: outline([
    '................',
    '...a........a...',
    '...a........a...',
    '..wwwwwwwwwwww..',
    '..wkkkwwwwkkkw..',
    '..wkbkwwwwkbkw..',
    '..wkkkwwwwkkkw..',
    '..wwwwwwwwwwww..',
    '..wwwwaaaawwww..',
    '..wwwwwwwwwwww..',
    'bbb..........bbb',
    'bbb.wwwwwwww.bbb',
    'bbb..........bbb',
    '................',
  ]),
  sigma: outline([
    '................',
    '..wwwwwwwwwww...',
    '..wwwwwwwwwww...',
    '...ww......aa...',
    '....ww..........',
    '.....ww.........',
    '......ww........',
    '.......ww.......',
    '......ww........',
    '.....ww.........',
    '....ww..........',
    '...ww......aa...',
    '..wwwwwwwwwww...',
    '..wwwwwwwwwww...',
    '................',
  ]),
};

export const PROJECTS = [
  {
    file: 'cart-woolgather.svg',
    url: 'https://github.com/juztripper/woolgather',
    title: 'WOOLGATHER',
    lines: ['A CALM WORKSPACE', 'FOR TURNING ROUGH', 'IDEAS INTO PROJECTS'],
    badge: 'LIVE',
    color: '#345365',
    accent: '#8b84d6',
    icon: 'yarn',
  },
  {
    file: 'cart-no-slop.svg',
    url: 'https://github.com/juztripper/no-slop',
    title: 'NO SLOP',
    lines: ['BROWSER EXTENSION', 'THAT FILTERS AI', 'FILLER & CLICKBAIT'],
    badge: 'OSS',
    color: '#9e2638',
    accent: '#f0a3ae',
    icon: 'noslop',
  },
  {
    file: 'cart-already-looked.svg',
    url: 'https://github.com/juztripper/already-looked',
    title: 'ALREADY LOOKED',
    lines: ['NAMING & BRANDING', 'SKILLS THAT ADMIT', "WHAT THEY COULDN'T SEE"],
    badge: 'SKILLS',
    color: '#1d6b64',
    accent: '#7fd6c7',
    icon: 'eye',
  },
  {
    file: 'cart-pixelforge.svg',
    url: 'https://github.com/juztripper/roblox-icon-tool',
    title: 'PIXELFORGE',
    lines: ['ROBLOX ICONS,', 'BATCH-FORGED AND', 'SHIPPED TO STUDIO'],
    badge: 'ROBLOX',
    color: '#b5501a',
    accent: '#ffc08a',
    icon: 'anvil',
  },
  {
    file: 'cart-maqueen-gestos.svg',
    url: 'https://github.com/juztripper/maqueen-gestos',
    title: 'MAQUEEN GESTOS',
    lines: ['DRIVE A ROBOT CAR', 'WITH YOUR HANDS,', 'THROUGH A CAMERA'],
    badge: 'MICRO:BIT',
    color: '#2a7a4f',
    accent: '#9be3b5',
    icon: 'robot',
  },
  {
    file: 'cart-math-log.svg',
    url: 'https://github.com/juztripper/math-log',
    title: 'MATH.LOG',
    lines: ['MATH NOTES FOR', '10TH & 11TH GRADE,', 'IN PLAIN WORDS'],
    badge: 'PT',
    color: '#5b3f99',
    accent: '#c9b5f5',
    icon: 'sigma',
  },
];

export function cart(p, i) {
  const body = '#1a2250';
  const bodyHi = '#2a3672';
  const bodyLo = '#0d1330';
  const lx = 28;
  const ly = 54;
  const lw = W - lx * 2;
  const lh = 150;

  // cart body with a clipped top-right corner, drawn as stepped pixels
  const shape = `M12 8H${W - 44}L${W - 12} 40V${H - 8}H12Z`;
  let ridges = '';
  for (let y = 18; y <= 38; y += 6) ridges += `<rect x="${W / 2 - 90}" y="${y}" width="180" height="3" fill="${bodyLo}"/><rect x="${W / 2 - 90}" y="${y + 3}" width="180" height="1" fill="${bodyHi}"/>`;
  let pins = '';
  for (let x = 60; x < W - 60; x += 14) pins += `<rect x="${x}" y="${H - 34}" width="8" height="18" fill="${C.ochre}"/><rect x="${x}" y="${H - 34}" width="8" height="3" fill="#ffd583"/>`;

  // label art: faint azulejo tiles on the right half, darker header band
  let tiles = '';
  for (let tx = lx + lw - 96; tx < lx + lw; tx += 40)
    for (let ty = ly + 26; ty < ly + lh; ty += 40) tiles += `<use href="#tile" x="${tx}" y="${ty}"/>`;

  const ic = ICONS[p.icon];
  const is = 5;
  const icx = lx + 16;
  const icy = ly + 40;
  const iconColors = { w: C.glaze, k: C.night, a: C.ochre, b: p.accent, r: '#ff5d6c' };

  const tx = lx + 112;
  const ts = textWidth(p.title, 3) > lw - 112 - 10 ? 2 : 3;
  const lines = p.lines.map((l, k) => textAt(l, { x: tx, y: ly + 72 + k * 20 - (p.lines.length > 3 ? 6 : 0), s: 2, fill: C.glaze, extra: 'opacity=".9"' })).join('');

  const bw = textWidth(p.badge, 2) + 14;
  const bx = icx + (16 * is) / 2 - bw / 2;
  const by = icy + 16 * is - 2;

  const defs = `
  <g id="tile" opacity=".12">${bitmap(TILES.flower, 0, 0, 5, { 1: '#000', 2: '#fff', 3: '#fff' })}</g>
  <clipPath id="lab"><rect x="${lx}" y="${ly}" width="${lw}" height="${lh}"/></clipPath>
  <linearGradient id="shine" x1="0" x2="1">
    <stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".22"/><stop offset="1" stop-color="#fff" stop-opacity="0"/>
  </linearGradient>`;

  const style = `
  .float{animation:float 2.8s ease-in-out infinite;animation-delay:${r2(-i * 0.45)}s}
  @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
  .shine{animation:shine 6s ease-in-out infinite;animation-delay:${r2(1 + i * 0.7)}s}
  @keyframes shine{0%{transform:translateX(-200px) skewX(-25deg)}30%,100%{transform:translateX(${W + 100}px) skewX(-25deg)}}
  .in{animation:in .6s cubic-bezier(.3,1.5,.5,1) both;animation-delay:${r2(i * 0.12)}s}
  @keyframes in{from{transform:translateY(30px);opacity:0}to{transform:none;opacity:1}}
  @media (prefers-reduced-motion:reduce){*{animation:none!important}}`;

  const svgBody = `
  <g class="in">
    <path d="${shape}" transform="translate(5 5)" fill="${bodyLo}" opacity=".7"/>
    <path d="${shape}" fill="${body}" stroke="${bodyHi}" stroke-width="3"/>
    ${ridges}
    <rect x="${lx - 4}" y="${ly - 4}" width="${lw + 8}" height="${lh + 8}" fill="${bodyLo}"/>
    <g clip-path="url(#lab)">
      <rect x="${lx}" y="${ly}" width="${lw}" height="${lh}" fill="${p.color}"/>
      ${tiles}
      <rect x="${lx}" y="${ly}" width="${lw}" height="26" fill="#000" opacity=".28"/>
      ${textAt("RIPPER'S GAMES", { x: lx + 12, y: ly + 6, s: 2, fill: p.accent })}
      ${textAt(`NO.${String(i + 1).padStart(2, '0')}`, { x: lx + lw - 12, y: ly + 6, s: 2, fill: C.glaze, anchor: 'end' })}
      <g class="float">${bitmap(ic, icx, icy, is, iconColors)}</g>
      <rect x="${bx}" y="${by}" width="${bw}" height="20" fill="${C.night}" opacity=".55"/>
      ${textAt(p.badge, { x: bx + 7, y: by + 3, s: 2, fill: C.ochre })}
      ${textAt(p.title, { x: tx, y: ly + 42 + (ts === 2 ? 4 : 0), s: ts, fill: C.glaze })}
      ${lines}
      <rect class="shine" x="0" y="${ly}" width="120" height="${lh}" fill="url(#shine)"/>
    </g>
    <rect x="44" y="${H - 38}" width="${W - 88}" height="26" fill="${bodyLo}"/>
    ${pins}
  </g>`;

  return svg(W, H, svgBody, { title: `${p.title.toLowerCase()}: ${p.lines.join(' ').toLowerCase()}`, defs, style });
}
