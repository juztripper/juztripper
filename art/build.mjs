// pixel art for the profile. run: python3 art/sprites.py && node art/build.mjs
// one rule above all: every pixel is the same size. the whole page is drawn on a grid of
// 4px cells (art, sprites and both fonts), nothing is rotated, curved or drawn between cells.
// theme: a desk at night. ripper's games tokens (charcoal, cream, one opal accent), and each
// project keeps its own brand colours. sprites come from the real logos (art/sprites.py).
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { svg, bitmap, textGlyphs, textWidth, rng, r2 } from './lib.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const SP = JSON.parse(readFileSync(join(here, 'sprites.json'), 'utf8'));
const U = 4;

const K = {
  ground: '#0d0d0c', deep: '#070706', surface: '#151513', raised: '#1c1c19',
  ink: '#ede7e1', dim: '#a29c94', faint: '#8d867c', line: '#34332f', line2: '#4a4843',
  opal: '#a9dde4', kraft: '#C9A06E', kraftLo: '#a8824f', seal: '#FAC834', green: '#4DAF4A',
};
const PIP = { g: '#4DAF4A', d: '#3a8f3d', w: '#FFF5E0', k: '#2a2826', l: '#8ad47f' };
const REDUCE = '@media (prefers-reduced-motion:reduce){*{animation:none!important}}';

// everything below takes cell coordinates
const R = (x, y, w, h, fill, extra = '') => `<rect x="${x * U}" y="${y * U}" width="${w * U}" height="${h * U}" fill="${fill}" ${extra}/>`;
const B = (rows, x, y, colors) => bitmap(rows, x * U, y * U, U, colors);
const cutPath = (w, h, k = 24) => `M${k} 0H${w}V${h - k}L${w - k} ${h}H0V${k}Z`;

// the small font: 3x5 cells, one cell apart
const F3 = {
  A: '010101111101101', B: '110101110101110', C: '011100100100011', D: '110101101101110', E: '111100110100111', F: '111100110100100',
  G: '011100101101011', H: '101101111101101', I: '111010010010111', J: '001001001101010', K: '101101110101101', L: '100100100100111',
  M: '101111111101101', N: '110101101101101', O: '111101101101111', P: '110101110100100', Q: '111101101111001', R: '110101110101101',
  S: '011100010001110', T: '111010010010010', U: '101101101101111', V: '101101101101010', W: '101101111111101', X: '101101010101101',
  Y: '101101010010010', Z: '111001010100111',
  0: '111101101101111', 1: '010110010010111', 2: '110001010100111', 3: '110001010001110', 4: '101101111001001',
  5: '111100110001110', 6: '011100111101111', 7: '111001010010010', 8: '111101111101111', 9: '111101111001110',
  '.': '000000000000010', ',': '000000000010100', "'": '010010000000000', '-': '000000111000000', ':': '000010000010000',
  '/': '001001010100100', '&': '010101010101011', '>': '100010001010100', '<': '001010100010001', '!': '010010010000010', '?': '110001010000010',
};
// m and w get five cells, or they read as n and h
const WIDE = { M: '1000111011101011000110001', W: '1000110001101011101110001' };
const gw = (ch) => (WIDE[ch] ? 5 : 3);
const w3 = (str) => [...str.toUpperCase()].reduce((n, ch) => n + gw(ch) + 1, -1);
function t3(str, x, y, fill, anchor = 'start') {
  if (anchor === 'end') x -= w3(str);
  if (anchor === 'middle') x -= Math.floor(w3(str) / 2);
  let d = '';
  for (const ch of str.toUpperCase()) {
    const w = gw(ch);
    const g = WIDE[ch] ?? F3[ch];
    if (g) for (let r = 0; r < 5; r++) for (let c = 0; c < w; c++) if (g[r * w + c] === '1') d += `M${(x + c) * U} ${(y + r) * U}h${U}v${U}h${-U}z`;
    x += w + 1;
  }
  return `<path d="${d}" fill="${fill}"/>`;
}
// the big font: 5x7, k cells per font pixel
const w7 = (str, k = 1) => textWidth(str, k);
const t7 = (str, x, y, fill, k = 1) => `<path d="${textGlyphs(str, x * U, y * U, k * U).map((g) => g.d).join('')}" fill="${fill}"/>`;

// pip, cycling through the kit's expressions
function pip(x, y, prefix = 'p') {
  const f = (n, cls) => `<g class="${prefix}${cls}">${B(SP[`pip-${n}`], x, y, PIP)}</g>`;
  const css = `
  .${prefix}a{animation:${prefix}a 9s steps(1) infinite}.${prefix}l,.${prefix}s,.${prefix}p{opacity:0}
  .${prefix}l{animation:${prefix}l 9s steps(1) infinite}.${prefix}s{animation:${prefix}s 9s steps(1) infinite}.${prefix}p{animation:${prefix}p 9s steps(1) infinite}
  @keyframes ${prefix}a{0%{opacity:1}30%{opacity:0}46%{opacity:1}60%{opacity:0}62.5%{opacity:1}78%{opacity:0}96%{opacity:1}}
  @keyframes ${prefix}l{0%{opacity:0}30%{opacity:1}46%{opacity:0}}
  @keyframes ${prefix}s{0%{opacity:0}60%{opacity:1}62.5%{opacity:0}}
  @keyframes ${prefix}p{0%{opacity:0}78%{opacity:1}96%{opacity:0}}`;
  return { body: f('awake', 'a') + f('looking', 'l') + f('asleep', 's') + f('pleased', 'p'), css };
}

// a toy brick, side view: 3 cells per stud, 4 tall
function brick(x, y, studs, color, hi, lo) {
  let s = R(x, y, studs * 3, 4, color) + R(x, y, studs * 3, 1, hi) + R(x, y + 3, studs * 3, 1, lo);
  for (let i = 0; i < studs; i++) s += R(x + i * 3, y - 1, 2, 1, hi);
  return s;
}

// a filled ellipse made of rows
function blob(cx, cy, widths, fill, extra = '') {
  return widths.map((w, i) => R(cx - w / 2, cy - Math.floor(widths.length / 2) + i, w, 1, fill, extra)).join('');
}

// ------------------------------------------------------------------ hero --
function hero() {
  const CW = 220, CH = 116, W = CW * U, H = CH * U;
  const rand = rng(11);
  const C = { frame: '#4a4843', frameLo: '#34332f', sky: '#16151c', house: '#2b2931', roof: '#201f27', fence: '#241f24', curtain: '#2d372c', curtainLo: '#232b22', pc: '#cdbfa8', pcLo: '#a99b85', pcHi: '#e2d6c1', warm: '#fff1cf', wood: '#2a221d' };
  let b = R(0, 0, CW, CH, K.ground);
  for (let i = 0; i < 150; i++) b += R(Math.floor(rand() * CW), Math.floor(rand() * 92), 1, 1, rand() < 0.5 ? '#121210' : '#0a0a09');
  const dy = 94;

  // window: rain, and the house across the street with two rooms still lit
  const wx = 130, wy = 14, ww = 60, wh = 46;
  b += R(wx - 2, wy - 2, ww + 4, wh + 4, C.frame) + R(wx - 2, wy + wh, ww + 4, 2, C.frameLo);
  let out = R(wx, wy, ww, wh, C.sky);
  for (let i = 0; i < 9; i++) out += R(wx + Math.floor(rand() * ww), wy + Math.floor(rand() * 12), 1, 1, K.ink, `opacity="${r2(0.25 + rand() * 0.4)}" class="tw" style="animation-delay:${r2(rand() * 4)}s"`);
  out += B(['.mmm', 'mm..', 'mm..', 'mm..', '.mmm'], wx + 52, wy + 3, { m: K.ink });
  for (let i = 0; i < 10; i++) out += R(wx + 18 - i, wy + 12 + i, 26 + i * 2, 1, C.roof);
  out += R(wx + 8, wy + 22, 46, 24, C.house) + R(wx, wy + 36, ww, 10, C.fence) + R(wx, wy + 36, ww, 1, '#322b32');
  out += blob(wx + 3, wy + 30, [6, 10, 12, 14, 14, 14, 12, 10, 8, 6], '#33261f');
  for (const [x, w] of [[11, 7], [25, 10]]) out += R(wx + x - 1, wy + 24, w + 2, 10, C.warm, 'opacity=".22" class="lit"') + R(wx + x, wy + 25, w, 8, C.warm, 'class="lit"') + R(wx + x + Math.floor(w / 2), wy + 25, 1, 8, '#d8c9a4');
  out += R(wx + 45, wy + 25, 5, 7, '#1a1920') + R(wx + 47, wy + 25, 1, 7, C.house);
  for (let i = 0; i < 34; i++) out += R(wx + Math.floor(rand() * ww), wy - 12 + Math.floor(rand() * wh), 1, 2, '#cfd3e6', `opacity="${r2(0.2 + rand() * 0.3)}" class="rain" style="animation-delay:${r2(-rand() * 1.2)}s;animation-duration:${r2(0.8 + rand() * 0.5)}s"`);
  b += `<g clip-path="url(#win)">${out}</g>`;
  b += R(wx + 19, wy, 2, wh, C.frame) + R(wx + 39, wy, 2, wh, C.frame);
  // rod and curtains
  b += R(wx - 14, 8, ww + 28, 1, C.wood) + R(wx - 15, 7, 2, 3, C.wood) + R(wx + ww + 13, 7, 2, 3, C.wood);
  for (const cx of [wx - 11, wx + ww + 2]) { b += R(cx, 9, 9, 58, C.curtain); for (let k = 0; k < 3; k++) b += R(cx + 1 + k * 3, 9, 1, 58, C.curtainLo); }
  // shelf: two finished sets with their labels
  const sy = 56;
  b += R(wx - 2, sy, ww + 4, 1, C.wood) + R(wx + 2, sy + 1, 1, 2, C.wood) + R(wx + ww - 3, sy + 1, 1, 2, C.wood);
  b += B(['..r...', '.bbbb.', '.bbbb.', '..k...', '..w...', 'gyggwg'], wx + 26, sy - 6, { r: '#d7553f', b: '#3f6fa8', k: '#5a3b2a', w: '#e9e2d8', g: '#5d9a54', y: '#d9b44a' });
  b += B(['g.......', 'g..bbbb.', 'gg.wwwwr', 'ggbbbbbb', 'gkyk.kyk'], wx + 42, sy - 5, { g: '#3f7a45', b: '#7fa3cf', w: '#e9e2d8', r: '#d7553f', k: '#33312F', y: '#d9b44a' });
  for (const lx of [wx + 26, wx + 43]) b += R(lx, sy + 1, 6, 3, K.ink) + R(lx + 1, sy + 2, 3, 1, K.ground);
  // clock (the hand ticks round), frames
  b += B(['.kkkkk.', 'kwwwwwk', 'kwwwwwk', 'kwwwwwk', 'kwwwwwk', 'kwwwwwk', '.kkkkk.'], 207, 13, { k: '#3b3129', w: K.ink }) + R(210, 16, 1, 1, K.ground);
  [[0, -2], [1, -1], [2, 0], [1, 1], [0, 2], [-1, 1], [-2, 0], [-1, -1]].forEach(([hx, hy], i) => (b += R(210 + hx, 16 + hy, 1, 1, K.ground, `class="hand" style="animation-delay:${i}s"`)));
  b += R(206, 26, 9, 11, K.line2) + R(207, 27, 7, 9, '#a9c3d6') + B(['.gg.', 'gggg', '.k..', 'bbbb'], 208, 29, { g: '#5d9a54', k: '#5a3b2a', b: '#3f6fa8' });
  b += R(206, 41, 9, 11, K.line2) + R(207, 42, 7, 9, K.ink) + B(['.r.', 'www', 'rrr', 'www', 'kkk'], 209, 44, { r: '#d7553f', w: '#fff', k: '#5a5a5a' });

  // name and line
  textGlyphs('RIPPER', 12 * U, 12 * U, 3 * U).forEach((g, i) => {
    b += `<g class="drop" style="animation-delay:${r2(0.15 + i * 0.08)}s"><path d="${g.d}" transform="translate(8 8)" fill="#24231f"/><path d="${g.d}" transform="translate(4 4)" fill="#3d3b36"/><path d="${g.d}" fill="${K.ink}"/></g>`;
  });
  b += `<g class="fade" style="animation-delay:.9s">${t3("I DON'T PLAY GAMES.", 12, 40, K.ink)}${t3('I MAKE THEM.', 12, 47, K.ink)}</g>`;
  b += `<g class="fade" style="animation-delay:1.6s">${t3('GAMES, APPS AND TOOLS.', 12, 56, K.faint)}</g>`;

  // desk
  b += R(0, dy, CW, CH - dy, '#241a16') + R(0, dy, CW, 1, '#3a2a23');
  // the old computer, code writing itself
  const px = 16, py = dy - 29;
  b += R(px, py, 36, 28, C.pc) + R(px, py, 36, 1, C.pcHi) + R(px, py + 26, 36, 2, C.pcLo) + R(px + 25, py + 2, 1, 22, C.pcLo);
  b += R(px + 2, py + 3, 22, 20, '#17130f') + R(px + 3, py + 4, 20, 18, '#050505');
  const code = [[0, 7, K.opal], [0, 4, K.dim, 5, 8, K.ink], [2, 11, K.dim], [2, 5, K.ink, 8, 6, K.opal], [4, 8, K.dim], [2, 3, K.dim], [0, 5, K.opal, 6, 9, K.dim]];
  code.forEach((ln, i) => {
    let row = '';
    for (let j = 0; j < ln.length; j += 3) row += R(px + 5 + ln[j], py + 6 + i * 2, ln[j + 1], 1, ln[j + 2]);
    b += `<g class="code" style="animation-delay:${r2(i * 0.6)}s">${row}</g>`;
  });
  b += R(px + 5, py + 20, 1, 1, K.opal, 'class="blink"');
  b += R(px + 27, py + 4, 7, 1, '#8f836f') + R(px + 27, py + 6, 2, 1, K.opal) + R(px + 27, py + 9, 2, 2, '#6f6557') + R(px + 31, py + 9, 2, 2, '#6f6557');
  for (let k = 0; k < 4; k++) b += R(px + 27, py + 13 + k * 2, 7, 1, C.pcLo);
  b += R(px + 31, py + 22, 3, 2, '#e0a020');
  b += R(px - 2, dy + 3, 32, 4, '#d8cdb8') + R(px - 2, dy + 6, 32, 1, C.pcLo);
  for (let k = 0; k < 15; k++) b += R(px - 1 + k * 2, dy + 4, 1, 1, '#f1e9da');
  b += R(px + 33, dy + 4, 4, 2, C.pcHi);
  // plant and pencils
  b += B(['..g..g...', '.gg.gg.g.', 'ggggggggg', '.ggdgggg.', 'gggggdgg.', '.gdggggg.', '..gg.gg..', '...g.g...'], 58, dy - 15, { g: '#2c4a31', d: '#1f3525' });
  b += R(60, dy - 7, 5, 8, '#59606f') + R(60, dy - 7, 5, 1, '#6d7484') + R(61, dy - 9, 1, 2, '#d9b44a') + R(63, dy - 10, 1, 3, '#c8532f');
  // lamp, its beam and the pool of light on the desk
  for (let i = 0; i < 20; i++) b += R(86 - Math.floor(i * 0.6), dy - 20 + i, 9 + Math.floor(i * 1.6), 1, C.warm, 'opacity=".05"');
  b += `<g class="flick">` + blob(96, dy + 10, [20, 32, 40, 44, 44, 40, 32, 20], '#e2a44c', 'opacity=".3"') + blob(96, dy + 10, [12, 22, 28, 28, 22, 12], '#ffd88f', 'opacity=".35"') + '</g>';
  for (let i = 0; i < 8; i++) b += R(84 + Math.floor(rand() * 28), dy - 14 + Math.floor(rand() * 14), 1, 1, C.warm, `opacity=".5" class="mote" style="animation-delay:${r2(-rand() * 8)}s;animation-duration:${r2(6 + rand() * 5)}s"`);
  b += R(70, dy, 10, 1, '#d9d0c4') + R(74, dy - 9, 1, 9, '#d9d0c4') + R(73, dy - 18, 1, 9, '#d9d0c4') + R(72, dy - 24, 1, 6, '#d9d0c4') + R(72, dy - 25, 8, 1, '#d9d0c4') + R(80, dy - 26, 6, 1, '#d9d0c4');
  b += B(['..sssss..', '.sssssss.', 'sssssssss', 'wwwwwwwww'], 85, dy - 25, { s: '#bfb5a8', w: C.warm });
  // mug with steam, tray, the collection book
  b += R(106, dy - 6, 5, 7, '#d8cdbd') + R(106, dy - 6, 5, 1, '#57634f') + R(111, dy - 5, 2, 1, '#d8cdbd') + R(112, dy - 4, 1, 3, '#d8cdbd') + R(111, dy - 1, 2, 1, '#d8cdbd');
  for (let i = 0; i < 2; i++) b += R(107 + i * 2, dy - 9, 1, 2, K.dim, `class="steam" style="animation-delay:${i * 1.2}s"`);
  b += R(108, dy + 8, 9, 1, '#6fa7a0') + R(108, dy + 9, 9, 1, '#4f817b');
  b += R(126, dy + 2, 44, 18, '#efe9e0') + R(126, dy + 2, 44, 3, K.green) + R(130, dy + 3, 1, 1, '#fff') + R(133, dy + 3, 1, 1, '#fff') + t3('COLLECTION', 128, dy + 7, '#33312F') + t3('BOOK', 128, dy + 13, '#33312F');

  const css = `
  .tw{animation:tw 3.4s steps(2) infinite}@keyframes tw{50%{opacity:.1}}
  .rain{animation:rain 1s steps(10) infinite}@keyframes rain{to{transform:translateY(${20 * U}px)}}
  .lit{animation:lit 7s steps(1) infinite}@keyframes lit{52%{opacity:.8}54%{opacity:1}}
  .hand{opacity:0;animation:hand 8s steps(1) infinite}@keyframes hand{0%{opacity:1}12.5%{opacity:0}}
  .drop{animation:drop .5s steps(5) both}@keyframes drop{from{transform:translateY(-40px);opacity:0}}
  .fade{animation:fade .01s linear both}@keyframes fade{from{opacity:0}}
  .flick{animation:flick 6s steps(1) infinite}@keyframes flick{47%{opacity:.6}49%{opacity:1}}
  .mote{animation:mote 8s steps(8) infinite}@keyframes mote{0%{opacity:0}15%{opacity:.6}100%{transform:translate(${3 * U}px,-${8 * U}px);opacity:0}}
  .code{opacity:0;animation:code 9s steps(1) infinite}@keyframes code{0%{opacity:0}4%,90%{opacity:1}100%{opacity:0}}
  .blink{animation:blink 1s steps(1) infinite}@keyframes blink{50%{opacity:0}}
  .steam{opacity:0;animation:steam 2.4s steps(4) infinite}@keyframes steam{0%{opacity:0}25%{opacity:.7}100%{opacity:0;transform:translateY(-${4 * U}px)}}
  ${REDUCE}`;
  const defs = `<clipPath id="c"><path d="${cutPath(W, H)}"/></clipPath><clipPath id="win"><rect x="${wx * U}" y="${wy * U}" width="${ww * U}" height="${wh * U}"/></clipPath>`;
  return svg(W, H, `<g clip-path="url(#c)">${b}</g><path d="${cutPath(W - 1, H - 1)}" transform="translate(.5 .5)" fill="none" stroke="${K.line}"/>`, {
    title: "ripper. i don't play games. i make them. games, apps and tools.", defs, style: css,
  });
}

// ------------------------------------------------------ build a brick set --
function brickset() {
  const CW = 220, CH = 76;
  const C = { cream: '#FFF5E0', ink: '#33312F', muted: '#5F5A52' };
  let b = R(0, 0, CW, CH, C.ink) + R(2, 2, CW - 4, CH - 4, C.cream);
  // kraft stage: pip watches a set get built, one piece at a time
  b += R(2, 2, 78, CH - 4, K.kraft) + R(80, 2, 1, CH - 4, C.ink) + R(2, 58, 78, 16, K.kraftLo) + R(2, 58, 78, 1, C.ink);
  const p = pip(8, 42, 'q');
  b += p.body;
  const bx = 46, by = 54;
  const tower = [
    [0, 0, 4, '#5f8fc4', '#86addb', '#44709f'], [0, -5, 2, '#8b5a3c', '#a97552', '#6b4229'], [6, -5, 2, '#f3ece4', '#ffffff', '#cfc6bb'],
    [0, -10, 4, '#5f8fc4', '#86addb', '#44709f'], [3, -15, 2, '#d7553f', '#ea7a66', '#b03f2c'],
  ];
  tower.forEach(([dx, dy, n, c, hi, lo], i) => (b += `<g class="pc" style="animation-delay:${r2(0.6 + i * 1.3)}s">${brick(bx + dx, by + dy, n, c, hi, lo)}</g>`));
  const x = 90;
  b += R(CW - 2 - w3('MAIN PROJECT') - 4, 2, w3('MAIN PROJECT') + 4, 9, C.ink) + t3('MAIN PROJECT', CW - 4, 4, C.cream, 'end');
  b += t7('BUILD A', x, 9, C.ink) + t7('BRICK SET', x, 19, C.ink, 2);
  b += t3('OPEN THE BOX. TEAR THE BAGS.', x, 38, C.ink) + t3('PRESS EVERY PIECE ON.', x, 45, C.ink);
  b += t3('A CALM ROBLOX GAME. NO TIMERS.', x, 53, C.muted);
  let cx = x;
  for (const [t, fill] of [['IN DEVELOPMENT', K.seal], ['ROBLOX', '#fff'], ['LUAU', '#fff']]) {
    const w = w3(t) + 6;
    b += R(cx + 1, 62 + 1, w, 9, C.ink) + R(cx, 62, w, 9, C.ink) + R(cx + 1, 63, w - 2, 7, fill) + t3(t, cx + 3, 64, C.ink);
    cx += w + 3;
  }
  const css = `${p.css}
  .pc{animation:pc 9s steps(1) infinite both}@keyframes pc{0%{transform:translateY(-${12 * U}px);opacity:0}2%{opacity:1}4%{transform:translateY(-${6 * U}px)}6%,88%{transform:translateY(0);opacity:1}94%,100%{opacity:0;transform:translateY(0)}}
  ${REDUCE}`;
  return svg(CW * U, CH * U, b, { title: 'build a brick set, my main project. a calm roblox game: open the box, tear the bags, press every piece on. in development.', style: css });
}

// ----------------------------------------------------------------- cards --
function card({ title, tag, lines, art, accent, live }) {
  const CW = 108, CH = 68, W = CW * U, H = CH * U, AW = 34;
  let b = `<path d="${cutPath(W, H, 12)}" fill="${K.surface}"/>`;
  b += `<g clip-path="url(#c)">${R(0, 0, AW, CH, K.ground)}${art.body}</g>` + `<rect x="${AW * U}" y="0" width="1" height="${H}" fill="${K.line}"/>`;
  const x = AW + 4;
  title.forEach((l, i) => (b += t7(l, x, 5 + i * 9, K.ink)));
  const ty = 5 + title.length * 9 + 2;
  lines.forEach((l, i) => (b += t3(l, x, ty + i * 7, K.dim)));
  b += R(x, CH - 9, 2, 2, accent, live ? 'class="blink"' : '') + t3(tag, x + 4, CH - 10, accent);
  const css = `.blink{animation:blink 1.4s steps(1) infinite}@keyframes blink{50%{opacity:.25}}${art.css || ''}${REDUCE}`;
  return svg(W, H, b + `<path d="${cutPath(W - 1, H - 1, 12)}" transform="translate(.5 .5)" fill="none" stroke="${K.line}"/>`, {
    title: `${title.join(' ').toLowerCase()}: ${lines.join(' ').toLowerCase()} (${tag.toLowerCase()})`,
    defs: `<clipPath id="c"><path d="${cutPath(W, H, 12)}"/></clipPath>`, style: css,
  });
}

function cards() {
  const out = {};
  const P = SP.palettes;
  // strut: pieces from its demo closet on two rails
  let a = R(0, 9, 34, 1, '#BBB3A7') + R(0, 37, 34, 1, '#BBB3A7');
  const hanger = ['..h..', '.h.h.', 'h...h'];
  [['polo_rust', 1], ['sweater_cream', 12], ['jacket_denim', 23]].forEach(([n, hx], i) => {
    a += `<g class="bob" style="animation-delay:${-i * 0.5}s">${B(hanger, hx + 2, 10, { h: '#BBB3A7' })}${B(SP[n], hx, 13, P[n])}</g>`;
  });
  [['jeans_mid', 2], ['chinos_beige', 13], ['trousers_charcoal', 24]].forEach(([n, hx], i) => {
    a += `<g class="bob" style="animation-delay:${-0.25 - i * 0.5}s">${B(hanger, hx + 1, 38, { h: '#BBB3A7' })}${B(SP[n], hx, 41, P[n])}</g>`;
  });
  out.strut = card({ title: ['STRUT'], tag: 'IN DEVELOPMENT', accent: '#F0532B', lines: ['AN AI WARDROBE', 'FOR THE CLOSET', 'YOU ALREADY OWN.'],
    art: { body: a, css: `.bob{animation:bob 1.5s steps(1) infinite}@keyframes bob{50%{transform:translateY(${U}px)}}` } });

  // pixelforge: the cube, capture brackets, a flash
  const pf = SP.pixelforge;
  a = B(pf.map((r) => r.replace(/c/g, '.')), 2, 19, { a: '#5cc8ff', b: '#0a84ff', d: '#0050e6' }) + `<g class="snap">${B(pf.map((r) => r.replace(/[abd]/g, '.')), 2, 19, { c: '#22e0ff' })}</g>` + R(0, 0, 34, 68, '#fff', 'class="shot"');
  out.pixelforge = card({ title: ['PIXELFORGE'], tag: 'LIVE', live: true, accent: '#2f8cff', lines: ['TURNS ANY ROBLOX', 'MODEL INTO A', 'CLEAN ICON.'],
    art: { body: a, css: '.snap{animation:snap 5s steps(1) infinite}@keyframes snap{0%,100%{opacity:.3}18%,80%{opacity:1}}.shot{opacity:0;animation:shot 5s steps(1) infinite}@keyframes shot{20%{opacity:.6}23%{opacity:0}}' } });

  // lucky baby bow: the horseshoe and bow, sparkles
  a = B(SP.lucky, 4, 21, { m: '#c9e8e2', p: '#f6c9c9', k: '#7f8a84', g: '#c9d6bd', w: '#ffffff' });
  [[3, 8], [28, 13], [27, 54], [4, 52]].forEach(([sx, sy], i) => (a += `<g class="spk" style="animation-delay:${i * 0.8}s">${B(['.w.', 'www', '.w.'], sx, sy, { w: '#f6c9c9' })}</g>`));
  out.lucky = card({ title: ['LUCKY', 'BABY BOW'], tag: 'LIVE', live: true, accent: '#f3bfc0', lines: ['SITE AND DESKTOP', 'APP FOR A CUSTOM', 'STATIONERY SHOP.'],
    art: { body: a, css: '.spk{opacity:0;animation:spk 3.2s steps(1) infinite}@keyframes spk{20%{opacity:1}45%{opacity:0}}' } });

  // already looked: the monogram, a beam scanning down
  const al = SP.al;
  a = R(0, 0, 34, 68, '#00300f') + B(al.map((r) => r.replace(/g/g, '.')), 3, 26, { w: '#f1fef3' }) + `<g class="scan">${B(al.map((r) => r.replace(/w/g, '.')), 3, 26, { g: '#2fc062' })}</g>` + R(0, 0, 34, 1, '#2fc062', 'class="beam" opacity=".5"');
  out.looked = card({ title: ['ALREADY', 'LOOKED'], tag: 'OPEN SOURCE', accent: '#2fc062', lines: ['AGENT SKILLS TO', 'NAME AND BRAND.', 'THEY SAY WHAT', 'THEY MISSED.'],
    art: { body: a, css: `.scan{animation:scan 2.4s steps(1) infinite}@keyframes scan{50%{opacity:.35}}.beam{animation:beam 6s steps(68) infinite}@keyframes beam{to{transform:translateY(${68 * U}px)}}` } });
  return out;
}

// ---------------------------------------------------------------- footer --
function footer() {
  const CW = 220, CH = 46, W = CW * U, H = CH * U;
  let b = `<path d="${cutPath(W, H)}" fill="${K.ground}"/>`;
  const tools = ['UNITY', 'ROBLOX STUDIO', 'LUAU', 'ROJO', 'BLENDER', 'KOTLIN', 'SWIFTUI', 'TYPESCRIPT', 'PYTHON'];
  b += t3('TOOLBOX', 10, 7, K.faint);
  const x0 = 10 + w3('TOOLBOX') + 5;
  let x = x0, ty = 5;
  tools.forEach((t, i) => {
    const w = w3(t) + 6;
    if (x + w > CW - 10) { x = x0; ty += 11; }
    b += `<g class="in" style="animation-delay:${r2(0.2 + i * 0.08)}s">${R(x, ty, w, 9, K.line)}${R(x + 1, ty + 1, w - 2, 7, K.surface)}${t3(t, x + 3, ty + 2, K.dim)}</g>`;
    x += w + 2;
  });
  b += R(10, 28, CW - 20, 1, K.line);
  // the name, corrected
  const y = 33;
  b += t7('REAPER', 10, y, K.faint) + R(9, y + 3, w7('REAPER') + 2, 1, K.opal, 'class="strike"');
  b += `<g class="fade">${t7('RIPPER', 10 + w7('REAPER') + 6, y, K.ink)}</g>`;
  b += t3('IT WAS MEANT TO BE REAPER BTW', CW - 10, y + 1, K.faint, 'end');
  const css = `
  .in{animation:in .01s linear both}@keyframes in{from{opacity:0}}
  .strike{transform-box:fill-box;transform-origin:0 50%;animation:strike .5s steps(8) 1.2s both}@keyframes strike{from{transform:scaleX(0)}}
  .fade{animation:fade .01s linear 1.9s both}@keyframes fade{from{opacity:0}}
  ${REDUCE}`;
  return svg(W, H, b + `<path d="${cutPath(W - 1, H - 1)}" transform="translate(.5 .5)" fill="none" stroke="${K.line}"/>`, {
    title: 'toolbox: unity, roblox studio, luau, rojo, blender, kotlin, swiftui, typescript, python. it was meant to be reaper btw.', style: css,
  });
}

const out = join(here, '..', 'assets');
mkdirSync(out, { recursive: true });
const files = { hero: hero(), brickset: brickset(), footer: footer(), ...cards() };
for (const [n, c] of Object.entries(files)) {
  writeFileSync(join(out, `${n}.svg`), c);
  console.log(n, (c.length / 1024).toFixed(0) + 'kb');
}
