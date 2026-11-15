// pixel art for the profile. run: python3 art/sprites.py && node art/build.mjs
// theme: a maker's desk at night. ripper's games tokens (charcoal, cream, one opal accent),
// and every project keeps its own brand colours. sprites come from the real logos (art/sprites.py).
import { readFileSync, writeFileSync, mkdirSync, readdirSync, unlinkSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { svg, bitmap, textAt, textGlyphs, textWidth, rng, r2 } from './lib.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const SP = JSON.parse(readFileSync(join(here, 'sprites.json'), 'utf8'));

const K = {
  ground: '#0d0d0c', deep: '#070706', surface: '#151513', raised: '#1c1c19',
  ink: '#ede7e1', dim: '#a29c94', faint: '#8d867c', line: '#34332f', line2: '#4a4843',
  opal: '#a9dde4', wood: '#3b3129', woodHi: '#5a4a3c', woodLo: '#221c17',
  kraft: '#C9A06E', kraftLo: '#a8824f', seal: '#FAC834', green: '#4DAF4A',
};
const PIP = { g: '#4DAF4A', d: '#3a8f3d', w: '#FFF5E0', k: '#2a2826', l: '#8ad47f' };
const REDUCE = '@media (prefers-reduced-motion:reduce){*{animation:none!important}}';

const rect = (x, y, w, h, fill, extra = '') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" ${extra}/>`;
const cutPath = (w, h, k = 22) => `M${k} 0H${w}V${h - k}L${w - k} ${h}H0V${k}Z`;

// pip, cycling through the kit's expressions
function pip(x, y, s, prefix = 'p') {
  const f = (n, cls) => `<g class="${prefix}${cls}">${bitmap(SP[`pip-${n}`], x, y, s, PIP)}</g>`;
  const css = `
  .${prefix}a{animation:${prefix}a 9s steps(1) infinite}.${prefix}l,.${prefix}s,.${prefix}p{opacity:0}
  .${prefix}l{animation:${prefix}l 9s steps(1) infinite}.${prefix}s{animation:${prefix}s 9s steps(1) infinite}.${prefix}p{animation:${prefix}p 9s steps(1) infinite}
  @keyframes ${prefix}a{0%{opacity:1}30%{opacity:0}46%{opacity:1}60%{opacity:0}62.5%{opacity:1}78%{opacity:0}96%{opacity:1}}
  @keyframes ${prefix}l{0%{opacity:0}30%{opacity:1}46%{opacity:0}}
  @keyframes ${prefix}s{0%{opacity:0}60%{opacity:1}62.5%{opacity:0}}
  @keyframes ${prefix}p{0%{opacity:0}78%{opacity:1}96%{opacity:0}}`;
  return { body: f('awake', 'a') + f('looking', 'l') + f('asleep', 's') + f('pleased', 'p'), css };
}

// a toy brick, side view, with studs
function brick(x, y, studs, color, hi, lo, u = 4) {
  const w = studs * 3 * u;
  let s = rect(x, y, w, 4 * u, color) + rect(x, y, w, u, hi) + rect(x, y + 3 * u, w, u, lo);
  for (let i = 0; i < studs; i++) s += rect(x + i * 3 * u + u / 2, y - u, 2 * u, u, hi);
  return s;
}

// ------------------------------------------------------------------ hero --
const U = 4;
// everything below takes cell coordinates
const R = (x, y, w, h, fill, extra = '') => `<rect x="${x * U}" y="${y * U}" width="${w * U}" height="${h * U}" fill="${fill}" ${extra}/>`;
const B = (rows, x, y, colors) => bitmap(rows, x * U, y * U, U, colors);

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
// a filled ellipse made of rows
function blob(cx, cy, widths, fill, extra = '') {
  return widths.map((w, i) => R(cx - w / 2, cy - Math.floor(widths.length / 2) + i, w, 1, fill, extra)).join('');
}

function hero() {
  const CW = 220, CH = 110, W = CW * U, H = CH * U;
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
  b += B(['..kkkkk..', '.kwwwwwk.', 'kwwwwwwwk', 'kwwwwwwwk', 'kwwwwwwwk', 'kwwwwwwwk', 'kwwwwwwwk', '.kwwwwwk.', '..kkkkk..'], 206, 11, { k: '#3b3129', w: K.ink }) + R(210, 15, 1, 1, K.ground) + R(211, 14, 1, 1, K.ground);
  [[0, -3], [2, -2], [3, 0], [2, 2], [0, 3], [-2, 2], [-3, 0], [-2, -2]].forEach(([hx, hy], i) => (b += R(210 + hx, 15 + hy, 1, 1, '#d7553f', `class="hand" style="animation-delay:${i}s"`)));
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
  // mug with steam
  b += R(60, dy - 6, 5, 7, '#d8cdbd') + R(60, dy - 6, 5, 1, '#57634f') + R(65, dy - 5, 2, 1, '#d8cdbd') + R(66, dy - 4, 1, 3, '#d8cdbd') + R(65, dy - 1, 2, 1, '#d8cdbd');
  for (let i = 0; i < 2; i++) b += R(61 + i * 2, dy - 9, 1, 2, K.dim, `class="steam" style="animation-delay:${i * 1.2}s"`);
  // lamp, its beam and the pool of light on the desk
  const lx = 100;
  for (let i = 0; i < 19; i++) b += R(lx + 16 - Math.floor(i * 0.5), dy - 19 + i, 9 + i, 1, C.warm, 'opacity=".05"');
  b += blob(lx + 20, dy + 8, [22, 36, 46, 50, 50, 46, 36, 22], '#3a2a1c') + blob(lx + 20, dy + 8, [14, 28, 38, 42, 38, 28, 14], '#5e4426');
  b += `<g class="flick">` + blob(lx + 20, dy + 8, [10, 22, 30, 30, 22, 10], '#93703a') + blob(lx + 20, dy + 8, [8, 16, 16, 8], '#d9b266') + '</g>';
  for (let i = 0; i < 8; i++) b += R(lx + 8 + Math.floor(rand() * 26), dy - 14 + Math.floor(rand() * 12), 1, 1, C.warm, `opacity=".5" class="mote" style="animation-delay:${r2(-rand() * 8)}s;animation-duration:${r2(6 + rand() * 5)}s"`);
  b += R(lx - 3, dy, 9, 1, '#d9d0c4') + R(lx + 1, dy - 23, 1, 23, '#d9d0c4') + R(lx + 1, dy - 24, 15, 1, '#d9d0c4');
  b += B(['..sssss..', '.sssssss.', 'sssssssss', 'wwwwwwwww'], lx + 15, dy - 24, { s: '#bfb5a8', w: C.warm });
  // a set being built under the lamp: one piece presses on, again and again
  b += brick((lx + 14) * U, (dy - 4) * U, 4, '#5f8fc4', '#86addb', '#44709f') + brick((lx + 14) * U, (dy - 9) * U, 2, '#f3ece4', '#ffffff', '#cfc6bb');
  b += `<g class="press">${brick((lx + 20) * U, (dy - 9) * U, 2, K.green, '#7fd07c', '#3a8f3d')}</g>`;
  b += brick((lx + 32) * U, (dy - 4) * U, 2, '#d7553f', '#ea7a66', '#b03f2c');
  // tray, plant and pencils
  b += R(150, dy + 6, 9, 1, '#6fa7a0') + R(150, dy + 7, 9, 1, '#4f817b');
  b += B(['..g..g...', '.gg.gg.g.', 'ggggggggg', '.ggdgggg.', 'gggggdgg.', '.gdggggg.', '..gg.gg..', '...g.g...'], 188, dy - 15, { g: '#2c4a31', d: '#1f3525' });
  b += R(190, dy - 7, 5, 8, '#59606f') + R(190, dy - 7, 5, 1, '#6d7484') + R(176, dy - 6, 4, 7, '#59606f') + R(177, dy - 8, 1, 2, '#d9b44a') + R(179, dy - 9, 1, 3, '#c8532f');

  const css = `
  .tw{animation:tw 3.4s steps(2) infinite}@keyframes tw{50%{opacity:.1}}
  .rain{animation:rain 1s steps(10) infinite}@keyframes rain{to{transform:translateY(${20 * U}px)}}
  .lit{animation:lit 7s steps(1) infinite}@keyframes lit{52%{opacity:.8}54%{opacity:1}}
  .hand{opacity:0;animation:hand 8s steps(1) infinite}@keyframes hand{0%{opacity:1}12.5%{opacity:0}}
  .drop{animation:drop .5s steps(5) both}@keyframes drop{from{transform:translateY(-40px);opacity:0}}
  .fade{animation:fade .01s linear both}@keyframes fade{from{opacity:0}}
  .flick{animation:flick 6s steps(1) infinite}@keyframes flick{47%{opacity:.75}49%{opacity:1}}
  .mote{animation:mote 8s steps(8) infinite}@keyframes mote{0%{opacity:0}15%{opacity:.6}100%{transform:translate(${3 * U}px,-${8 * U}px);opacity:0}}
  .code{opacity:0;animation:code 9s steps(1) infinite}@keyframes code{0%{opacity:0}4%,90%{opacity:1}100%{opacity:0}}
  .blink{animation:blink 1s steps(1) infinite}@keyframes blink{50%{opacity:0}}
  .steam{opacity:0;animation:steam 2.4s steps(4) infinite}@keyframes steam{0%{opacity:0}25%{opacity:.7}100%{opacity:0;transform:translateY(-${4 * U}px)}}
  .press{animation:press 4s steps(1) infinite}@keyframes press{0%{transform:translateY(-${10 * U}px);opacity:0}10%{opacity:1}18%{transform:translateY(-${5 * U}px)}26%,100%{transform:translateY(0);opacity:1}}
  ${REDUCE}`;
  const defs = `<clipPath id="c"><path d="${cutPath(W, H)}"/></clipPath><clipPath id="win"><rect x="${wx * U}" y="${wy * U}" width="${ww * U}" height="${wh * U}"/></clipPath>`;
  return svg(W, H, `<g clip-path="url(#c)">${b}</g><path d="${cutPath(W - 1, H - 1)}" transform="translate(.5 .5)" fill="none" stroke="${K.line}"/>`, {
    title: "ripper. i don't play games. i make them. games, apps and tools.", defs, style: css,
  });
}

// ------------------------------------------------------ build a brick set --
function brickset() {
  const W = 880, H = 300, SW = 408;
  const C = { cream: '#FFF5E0', ink: '#33312F', muted: '#5F5A52' };
  let b = rect(0, 0, W, H, C.cream) + rect(0, 0, W, H, 'none', `stroke="${C.ink}" stroke-width="8"`);
  // the stage: a set gets built one piece at a time while pip talks you through it
  const fy = 240;
  b += rect(4, 4, SW - 4, H - 8, K.kraft) + rect(SW, 4, 4, H - 8, C.ink) + rect(4, fy, SW - 4, H - fy - 4, K.kraftLo) + rect(4, fy, SW - 4, 4, C.ink);
  // the opened box and bag 1
  b += rect(20, fy - 52, 96, 52, '#b98d58') + rect(20, fy - 52, 96, 4, C.ink) + rect(20, fy - 52, 4, 52, C.ink) + rect(112, fy - 52, 4, 52, C.ink) + rect(12, fy - 64, 56, 12, '#d9b68a') + rect(12, fy - 68, 56, 4, C.ink) + rect(12, fy - 64, 4, 12, C.ink);
  b += textAt('MAILBOX', { x: 30, y: fy - 40, s: 2, fill: C.ink }) + rect(30, fy - 20, 16, 16, K.seal) + rect(30, fy - 20, 16, 4, C.ink) + rect(30, fy - 8, 16, 4, C.ink) + rect(26, fy - 16, 4, 8, C.ink) + rect(46, fy - 16, 4, 8, C.ink);
  b += rect(76, fy - 96, 40, 44, '#eef3ea') + rect(76, fy - 100, 40, 4, C.ink) + rect(72, fy - 96, 4, 44, C.ink) + rect(116, fy - 96, 4, 44, C.ink) + rect(84, fy - 88, 24, 24, K.seal) + textAt('1', { x: 91, y: fy - 86, s: 3, fill: C.ink });
  // the mailbox set, pressed on in order
  const mx = 150;
  const blue = ['#5f8fc4', '#86addb', '#44709f'], brown = ['#8b5a3c', '#a97552', '#6b4229'], white = ['#f3ece4', '#ffffff', '#cfc6bb'], green = [K.green, '#7fd07c', '#3a8f3d'], red = ['#d7553f', '#ea7a66', '#b03f2c'];
  const pieces = [
    [0, 0, 8, green], [0, -20, 2, white], [72, -20, 2, white], [36, -20, 2, brown], [36, -40, 2, brown],
    [12, -60, 6, blue], [12, -80, 6, blue], [24, -100, 4, blue], [84, -80, 1, red],
  ];
  pieces.forEach(([dx, dy, n, c], i) => (b += `<g class="pc" style="animation-delay:${r2(1.2 + i * 0.9)}s">${brick(mx + dx, fy - 16 + dy, n, c[0], c[1], c[2])}</g>`));
  // pip, and what pip says (the game's own lines)
  const p = pip(SW - 132, fy - 29 * 3 + 3, 3, 'q');
  b += p.body;
  const says = ['BAG 1 FIRST.', 'THAT ONE CLICKED.', 'DONE. SHELF.'];
  const bx = 150, by = 24, bw = 234;
  b += rect(bx + 4, by + 4, bw, 40, C.ink) + rect(bx, by, bw, 40, C.cream) + rect(bx, by, bw, 4, C.ink) + rect(bx, by + 36, bw, 4, C.ink) + rect(bx, by, 4, 40, C.ink) + rect(bx + bw - 4, by, 4, 40, C.ink);
  b += rect(SW - 84, by + 40, 12, 4, C.cream) + rect(SW - 84, by + 44, 4, 12, C.ink) + rect(SW - 72, by + 44, 4, 8, C.ink) + rect(SW - 80, by + 44, 8, 8, C.cream) + rect(SW - 76, by + 52, 4, 4, C.ink) + rect(SW - 80, by + 52, 4, 4, C.cream) + rect(SW - 80, by + 56, 4, 4, C.ink);
  says.forEach((t, i) => (b += `<g class="say s${i}">${textAt(t, { x: bx + 16, y: by + 13, s: 2, fill: C.ink })}</g>`));

  const x = SW + 30;
  b += rect(W - 150, 4, 146, 30, C.ink) + textAt('MAIN PROJECT', { x: W - 77, y: 12, s: 2, fill: C.cream, anchor: 'middle' });
  b += textAt('BUILD A', { x, y: 40, s: 3, fill: C.ink }) + textAt('BRICK SET', { x, y: 70, s: 6, fill: C.ink });
  b += textAt('OPEN THE BOX. TEAR THE BAGS.', { x, y: 134, s: 2, fill: C.ink }) + textAt('PRESS EVERY PIECE ON.', { x, y: 156, s: 2, fill: C.ink });
  b += textAt('A CALM ROBLOX GAME ABOUT BUILDING', { x, y: 190, s: 2, fill: C.muted }) + textAt('BOXED BRICK SETS BY HAND. NO TIMERS.', { x, y: 210, s: 2, fill: C.muted });
  let cx = x;
  for (const [t, fill] of [['IN DEVELOPMENT', K.seal], ['ROBLOX', '#fff'], ['LUAU', '#fff']]) {
    const w = textWidth(t, 2) + 20;
    b += rect(cx + 4, 246 + 4, w, 28, C.ink) + rect(cx, 246, w, 28, fill, `stroke="${C.ink}" stroke-width="3"`) + textAt(t, { x: cx + 10, y: 253, s: 2, fill: C.ink });
    cx += w + 14;
  }
  const css = `${p.css}
  .pc{animation:pc 12s steps(1) infinite both}@keyframes pc{0%{transform:translateY(-48px);opacity:0}1%{opacity:1}2%{transform:translateY(-24px)}3%{transform:translateY(-8px)}4%,92%{transform:translateY(0);opacity:1}96%,100%{opacity:0;transform:translateY(0)}}
  .say{opacity:0}.s0{animation:s0 12s steps(1) infinite}.s1{animation:s1 12s steps(1) infinite}.s2{animation:s2 12s steps(1) infinite}
  @keyframes s0{0%{opacity:1}30%{opacity:0}97%{opacity:1}}@keyframes s1{30%{opacity:1}76%{opacity:0}}@keyframes s2{76%{opacity:1}97%{opacity:0}}
  ${REDUCE}`;
  return svg(W, H, b, { title: 'build a brick set, my main project. a calm roblox game: open the box, tear the bags, press every piece on. in development.', style: css });
}

// ----------------------------------------------------------------- cards --
function card({ title, tag, lines, meta, art, accent, live }) {
  const W = 434, H = 236;
  let b = `<path d="${cutPath(W, H, 13)}" fill="${K.surface}"/>`;
  b += `<g clip-path="url(#c)">${rect(0, 0, 150, H, K.ground)}${rect(150, 0, 1, H, K.line)}${art.body}</g>`;
  const x = 172;
  b += textAt(title, { x, y: 30, s: textWidth(title, 3) > W - x - 16 ? 2 : 3, fill: K.ink });
  lines.forEach((l, i) => (b += textAt(l, { x, y: 72 + i * 22, s: 2, fill: K.dim })));
  b += rect(x, H - 62, W - x - 22, 1, K.line);
  b += rect(x, H - 42, 8, 8, accent, live ? 'class="blink"' : '') + textAt(tag, { x: x + 16, y: H - 45, s: 2, fill: accent });
  b += textAt(meta, { x, y: H - 23, s: 1.5, fill: K.faint });
  const css = `.blink{animation:blink 1.4s steps(1) infinite}@keyframes blink{50%{opacity:.25}}${art.css || ''}${REDUCE}`;
  return svg(W, H, b + `<path d="${cutPath(W - 1, H - 1, 13)}" transform="translate(.5 .5)" fill="none" stroke="${K.line}"/>`, {
    title: `${title.toLowerCase()}: ${lines.join(' ').toLowerCase()} (${tag.toLowerCase()})`,
    defs: `<clipPath id="c"><path d="${cutPath(W, H, 13)}"/></clipPath>`, style: css,
  });
}

const centered = (rows, s, colors, cx = 75, cy = 118) => bitmap(rows, Math.round(cx - (rows[0].length * s) / 2), Math.round(cy - (rows.length * s) / 2), s, colors);

function cards() {
  const out = {};
  // strut: two plain pieces on a rail, in strut's own colours, big pixels
  const G = 6;
  let a = rect(0, 54, 150, G, '#BBB3A7');
  const hanger = ['....h....', '...h.h...', '..h...h..', '.h.....h.'];
  const tee = ['...ooo.ooo...', '.ooooooooooo.', 'ooooooooooooo', 'ooooooooooooo', 'oo.ooooooo.oo', '...ooooooo...', '...ooooooo...', '...ooooooo...', '...ooooooo...', '...ooooooo...', '...ooooooo...', '...ddddddd...'];
  const pants = ['ddddddddd', 'ooooooooo', 'ooooooooo', 'oooo.oooo', 'oooo.oooo', 'oooo.oooo', 'oooo.oooo', 'oooo.oooo', 'oooo.oooo', 'oooo.oooo', 'oooo.oooo', 'oooo.oooo', 'oooo.oooo', 'oooo.oooo', 'oooo.oooo', 'dddd.dddd'];
  [[tee, 6, { o: '#F0532B', d: '#c9431f' }], [pants, 90, { o: '#FAF8F5', d: '#cdc6bb' }]].forEach(([g, gx, col], i) => {
    const w = g[0].length * G;
    a += `<g class="bob" style="animation-delay:${-i * 0.9}s">${bitmap(hanger, gx + (w - 54) / 2, 60, G, { h: '#BBB3A7' })}${bitmap(g, gx, 84, G, col)}</g>`;
  });
  out.strut = card({ title: 'STRUT', tag: 'IN DEVELOPMENT', accent: '#F0532B', lines: ['AN AI WARDROBE FOR', 'THE CLOSET YOU', 'ALREADY OWN.'], meta: 'ANDROID, KOTLIN, COMPOSE',
    art: { body: a, css: '.bob{animation:bob 1.8s steps(1) infinite}@keyframes bob{50%{transform:translateY(6px)}}' } });

  // pixelforge: the cube, capture brackets snapping, a flash
  const pf = SP.pixelforge;
  const cube = pf.map((r) => r.replace(/c/g, '.'));
  const br = pf.map((r) => r.replace(/[abd]/g, '.'));
  a = centered(cube, 3.5, { a: '#5cc8ff', b: '#0a84ff', d: '#0050e6' }) + `<g class="snap">${centered(br, 3.5, { c: '#22e0ff' })}</g>` + rect(0, 0, 150, 236, '#fff', 'class="shot"');
  out.pixelforge = card({ title: 'PIXELFORGE', tag: 'LIVE', live: true, accent: '#2f8cff', lines: ['TURNS ANY ROBLOX', 'MODEL INTO A', 'CLEAN ICON.'], meta: 'STUDIO PLUGIN, ITCH.IO',
    art: { body: a, css: '.snap{transform-origin:75px 118px;animation:snap 5s cubic-bezier(.16,1,.3,1) infinite}@keyframes snap{0%,100%{transform:scale(1.25);opacity:.3}18%,80%{transform:scale(1);opacity:1}}.shot{opacity:0;animation:shot 5s linear infinite}@keyframes shot{0%,19%{opacity:0}20%{opacity:.7}27%,100%{opacity:0}}' } });

  // lucky baby bow: the horseshoe and bow, sparkles
  a = centered(SP.lucky, 3, { m: '#c9e8e2', p: '#f6c9c9', k: '#7f8a84', g: '#c9d6bd', w: '#ffffff' });
  [[22, 40], [128, 62], [118, 196], [24, 184]].forEach(([sx, sy], i) => (a += `<g class="spk" style="animation-delay:${i * 0.8}s">${bitmap(['.w.', 'www', '.w.'], sx, sy, 3, { w: '#f6c9c9' })}</g>`));
  out.lucky = card({ title: 'LUCKY BABY BOW', tag: 'LIVE', live: true, accent: '#f3bfc0', lines: ['SITE AND DESKTOP APP', 'FOR A CUSTOM', 'STATIONERY SHOP.'], meta: 'WEB, ELECTRON, TYPESCRIPT',
    art: { body: a, css: '.spk{opacity:0;animation:spk 3.2s ease-in-out infinite}@keyframes spk{0%,60%,100%{opacity:0}30%{opacity:1}}' } });

  // already looked: the monogram, the slash scanning
  const al = SP.al;
  a = rect(0, 0, 150, 236, '#00300f') + centered(al.map((r) => r.replace(/g/g, '.')), 3, { w: '#f1fef3' }) + `<g class="scan">${centered(al.map((r) => r.replace(/w/g, '.')), 3, { g: '#2fc062' })}</g>`;
  a += rect(0, 0, 150, 3, '#2fc062', 'class="beam"');
  out.looked = card({ title: 'ALREADY LOOKED', tag: 'OPEN SOURCE', accent: '#2fc062', lines: ['AGENT SKILLS THAT', 'NAME IT, BRAND IT,', 'AND SAY WHAT THEY', "COULDN'T CHECK."], meta: 'NPX SKILLS ADD',
    art: { body: a, css: '.scan{animation:scan 2.4s steps(1) infinite}@keyframes scan{50%{opacity:.35}}.beam{opacity:.5;animation:beam 5s linear infinite}@keyframes beam{from{transform:translateY(0)}to{transform:translateY(236px)}}' } });
  return out;
}

// ---------------------------------------------------------------- footer --
function footer() {
  const W = 880, H = 186;
  let b = `<path d="${cutPath(W, H)}" fill="${K.ground}"/>`;
  const tools = ['UNITY', 'ROBLOX STUDIO', 'LUAU', 'ROJO', 'BLENDER', 'KOTLIN', 'SWIFTUI', 'TYPESCRIPT', 'PYTHON'];
  let x = 40;
  b += textAt('TOOLBOX', { x, y: 30, s: 2, fill: K.faint });
  x += textWidth('TOOLBOX', 2) + 22;
  const x0 = x;
  let ty = 22;
  tools.forEach((t, i) => {
    const w = textWidth(t, 2) + 16;
    if (x + w > W - 40) { x = x0; ty += 36; }
    b += `<g class="in" style="animation-delay:${r2(0.2 + i * 0.07)}s">${rect(x, ty, w, 28, K.surface, `stroke="${K.line}"`)}${textAt(t, { x: x + 8, y: ty + 7, s: 2, fill: K.dim })}</g>`;
    x += w + 8;
  });
  b += rect(40, 108, W - 80, 1, K.line);
  // the name, corrected
  const y = 134;
  b += textAt('REAPER', { x: 40, y, s: 3, fill: K.faint }) + rect(36, y + 9, textWidth('REAPER', 3) + 8, 3, K.opal, 'class="strike"');
  b += `<g class="fade">${textAt('RIPPER', { x: 40 + textWidth('REAPER', 3) + 24, y, s: 3, fill: K.ink })}</g>`;
  b += textAt('IT WAS MEANT TO BE REAPER BTW', { x: W - 40, y: y + 4, s: 2, fill: K.faint, anchor: 'end' });
  const css = `
  .in{animation:in .5s cubic-bezier(.16,1,.3,1) both}@keyframes in{from{opacity:0;transform:translateY(8px)}}
  .strike{transform-box:fill-box;transform-origin:0 50%;animation:strike .5s cubic-bezier(.76,0,.24,1) 1.2s both}@keyframes strike{from{transform:scaleX(0)}}
  .fade{animation:fade .5s ease-out 1.8s both}@keyframes fade{from{opacity:0;transform:translateX(-10px)}}
  ${REDUCE}`;
  return svg(W, H, b + `<path d="${cutPath(W - 1, H - 1)}" transform="translate(.5 .5)" fill="none" stroke="${K.line}"/>`, {
    title: 'toolbox: unity, roblox studio, luau, rojo, blender, kotlin, swiftui, typescript, python. it was meant to be reaper btw.', style: css,
  });
}

const out = join(here, '..', 'assets');
mkdirSync(out, { recursive: true });
const files = { hero: hero(), brickset: brickset(), footer: footer(), ...cards() };
const readmePath = join(here, '..', 'README.md');
let readme = readFileSync(readmePath, 'utf8');
for (const f of readdirSync(out)) if (f.endsWith('.svg') && f !== 'spacer.svg') unlinkSync(join(out, f));
for (const [n, c] of Object.entries(files)) {
  // the content hash is in the file name, so a changed image is a new url and nothing can serve a stale copy
  const file = `${n}-${createHash('sha1').update(c).digest('hex').slice(0, 8)}.svg`;
  writeFileSync(join(out, file), c);
  readme = readme.replace(new RegExp(`assets/${n}(-[0-9a-f]{8})?\\.svg`, 'g'), `assets/${file}`);
  console.log(file, (c.length / 1024).toFixed(0) + 'kb');
}
writeFileSync(readmePath, readme);
