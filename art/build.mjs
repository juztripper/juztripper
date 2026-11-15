// pixel art for the profile. run: python3 art/sprites.py && node art/build.mjs
// theme: a maker's desk at night. ripper's games tokens (charcoal, cream, one opal accent),
// and every project keeps its own brand colours. sprites come from the real logos (art/sprites.py).
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
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
function hero() {
  const W = 880, H = 468;
  const rand = rng(11);
  const C = { frame: '#4a4843', frameLo: '#34332f', sky: '#16151c', house: '#2b2931', roof: '#201f27', fence: '#241f24', curtain: '#2d372c', curtainLo: '#232b22', pc: '#cdbfa8', pcLo: '#a99b85', pcHi: '#e2d6c1', warm: '#fff1cf' };
  let b = rect(0, 0, W, H, K.ground);
  for (let i = 0; i < 150; i++) b += rect(Math.floor(rand() * 220) * 4, Math.floor(rand() * 90) * 4, 4, 4, rand() < 0.5 ? '#121210' : '#0a0a09');
  const dy = 378;

  // the window: rain, and the house across the street with two rooms still lit
  const wx = 514, wy = 52, ww = 248, wh = 196;
  b += rect(wx - 8, wy - 8, ww + 16, wh + 16, C.frame) + rect(wx - 8, wy + wh, ww + 16, 8, C.frameLo);
  let out = rect(wx, wy, ww, wh, C.sky);
  for (let i = 0; i < 14; i++) out += rect(wx + Math.floor(rand() * ww), wy + Math.floor(rand() * 60), 2, 2, K.ink, `opacity="${r2(0.2 + rand() * 0.4)}" class="tw" style="animation-delay:${r2(rand() * 4)}s"`);
  out += bitmap(['..mmmm.', '.mmm...', 'mmm....', 'mmm....', 'mmm....', '.mmm...', '..mmmm.'], wx + 206, wy + 14, 4, { m: K.ink });
  out += `<path d="M${wx + 16} ${wy + 96}L${wx + 84} ${wy + 34}H${wx + 190}L${wx + 250} ${wy + 96}Z" fill="${C.roof}"/>` + rect(wx + 26, wy + 96, 214, 100, C.house);
  out += rect(wx, wy + 156, ww, 40, C.fence) + rect(wx, wy + 156, ww, 3, '#322b32');
  out += `<circle cx="${wx + 14}" cy="${wy + 130}" r="34" fill="#3a2a22"/><circle cx="${wx + 40}" cy="${wy + 150}" r="20" fill="#2f221c"/>`;
  for (const [x, w] of [[64, 28], [118, 44]]) out += rect(wx + x - 10, wy + 100, w + 20, 50, C.warm, 'opacity=".1" class="lit"') + rect(wx + x - 4, wy + 106, w + 8, 38, C.warm, 'opacity=".25" class="lit"') + rect(wx + x, wy + 110, w, 30, C.warm, 'class="lit"') + rect(wx + x + w / 2 - 1, wy + 110, 2, 30, '#d8c9a4');
  out += rect(wx + 188, wy + 112, 24, 28, '#1a1920') + rect(wx + 199, wy + 112, 2, 28, C.house);
  for (let i = 0; i < 54; i++) out += rect(wx + Math.floor(rand() * ww), wy - 30 + Math.floor(rand() * wh), 1.5, 10, '#cfd3e6', `opacity="${r2(0.18 + rand() * 0.35)}" class="rain" style="animation-delay:${r2(-rand() * 1.2)}s;animation-duration:${r2(0.7 + rand() * 0.5)}s"`);
  b += `<g clip-path="url(#win)">${out}</g>`;
  b += rect(wx + 82, wy, 7, wh, C.frame) + rect(wx + 172, wy, 7, wh, C.frame) + rect(wx + 84, wy + 100, 3, 12, K.ground) + rect(wx + 174, wy + 100, 3, 12, K.ground);
  // rod and curtains
  b += rect(wx - 58, 30, ww + 116, 5, '#2a221d') + rect(wx - 64, 27, 10, 11, '#2a221d') + rect(wx + ww + 54, 27, 10, 11, '#2a221d');
  for (const cx of [wx - 44, wx + ww + 2]) { b += rect(cx, 35, 42, 234, C.curtain); for (let k = 0; k < 4; k++) b += rect(cx + 6 + k * 10, 35, 4, 234, C.curtainLo); }
  // shelf: two finished sets with their labels
  const sy = 234;
  b += rect(wx - 8, sy, ww + 16, 5, '#2a221d') + rect(wx + 6, sy + 5, 4, 10, '#2a221d') + rect(wx + ww - 10, sy + 5, 4, 10, '#2a221d');
  b += bitmap(['..r...', '.bbbb.', '.bbbb.', '..k...', '..w...', 'gyggwg'], wx + 132, sy - 24, 4, { r: '#d7553f', b: '#3f6fa8', k: '#5a3b2a', w: '#e9e2d8', g: '#5d9a54', y: '#d9b44a' });
  b += bitmap(['g.......', 'g..bbbb.', 'gg.wwwwr', 'ggbbbbbb', 'gkyk.kyk'], wx + 190, sy - 20, 4, { g: '#3f7a45', b: '#7fa3cf', w: '#e9e2d8', r: '#d7553f', k: '#33312F', y: '#d9b44a' });
  for (const lx of [wx + 130, wx + 192]) b += rect(lx, sy + 5, 30, 11, K.ink) + rect(lx + 3, sy + 8, 16, 2, K.ground) + rect(lx + 3, sy + 12, 10, 1, K.faint);
  // clock and frames
  b += `<circle cx="832" cy="84" r="20" fill="#3b3129"/><circle cx="832" cy="84" r="16" fill="${K.ink}"/><path d="M832 84L840 80" stroke="${K.ground}" stroke-width="2.5"/><path d="M832 84V71" stroke="${K.ground}" stroke-width="1.5" class="tick" style="transform-origin:832px 84px"/>`;
  b += rect(816, 124, 32, 40, K.line2) + rect(820, 128, 24, 32, '#a9c3d6') + bitmap(['.gg.', 'gggg', '.k..', 'bbbb'], 824, 134, 4, { g: '#5d9a54', k: '#5a3b2a', b: '#3f6fa8' });
  b += rect(816, 176, 32, 40, K.line2) + rect(820, 180, 24, 32, K.ink) + bitmap(['..r.', '.ww.', '.rr.', '.ww.', 'kkkk'], 824, 184, 4, { r: '#d7553f', w: '#fff', k: '#5a5a5a' });

  // name and line
  const NAME = 'RIPPER', S = 11, nx = 48, ny = 56;
  textGlyphs(NAME, nx, ny, S).forEach((g, i) => {
    let l = '';
    for (let k = 4; k >= 1; k--) l += `<path d="${g.d}" transform="translate(${k * 3} ${k * 3})" fill="${k > 2 ? '#24231f' : '#3d3b36'}"/>`;
    b += `<g class="drop" style="animation-delay:${r2(0.15 + i * 0.08)}s">${l}<path d="${g.d}" fill="${K.ink}"/></g>`;
  });
  const t1 = "I DON'T PLAY GAMES. I MAKE THEM.";
  const ty = ny + 7 * S + 30;
  b += `<g class="fade" style="animation-delay:.9s">${textAt(t1, { x: nx, y: ty, s: 2, fill: K.ink })}</g>`;
  b += `<rect class="type" x="${nx - 2}" y="${ty - 4}" width="${textWidth(t1, 2) + 6}" height="22" fill="${K.ground}"/>`;
  b += `<g class="fade" style="animation-delay:2.2s">${textAt('GAMES, APPS AND TOOLS, START TO FINISH.', { x: nx, y: ty + 26, s: 2, fill: K.faint })}</g>`;

  // desk
  b += rect(0, dy, W, H - dy, '#241a16') + rect(0, dy, W, 4, '#3a2a23') + rect(0, dy + 4, W, 2, '#1a120f');
  // the old computer, code writing itself
  const px = 70, py = dy - 118;
  b += `<ellipse cx="${px + 46}" cy="${py + 48}" rx="120" ry="84" fill="url(#glow)" class="pulse"/>`;
  b += rect(px, py, 140, 112, C.pc) + rect(px, py, 140, 4, C.pcHi) + rect(px, py + 104, 140, 8, C.pcLo) + rect(px + 96, py + 6, 2, 86, C.pcLo);
  b += rect(px + 8, py + 10, 84, 78, '#17130f') + `<rect x="${px + 12}" y="${py + 14}" width="76" height="70" rx="6" fill="#050505"/>`;
  const code = [[0, 26, K.opal], [0, 14, K.dim, 18, 30, K.ink], [8, 44, K.dim], [8, 20, K.ink, 32, 24, K.opal], [16, 30, K.dim], [8, 12, K.dim], [0, 18, K.opal, 22, 34, K.dim]];
  code.forEach((ln, i) => {
    let row = '';
    for (let j = 0; j < ln.length; j += 3) row += rect(px + 20 + ln[j], py + 22 + i * 8, ln[j + 1], 3, ln[j + 2]);
    b += `<g class="code" style="animation-delay:${r2(i * 0.6)}s">${row}</g>`;
  });
  b += rect(px + 20, py + 22 + 7 * 8, 5, 5, K.opal, 'class="blink"');
  b += rect(px + 104, py + 14, 28, 5, '#8f836f') + rect(px + 106, py + 22, 6, 2, K.opal) + `<circle cx="${px + 110}" cy="${py + 44}" r="5" fill="#6f6557"/><circle cx="${px + 125}" cy="${py + 44}" r="5" fill="#6f6557"/>`;
  for (let k = 0; k < 5; k++) b += rect(px + 104, py + 58 + k * 5, 28, 2, C.pcLo);
  b += rect(px + 120, py + 90, 12, 9, '#e0a020');
  b += rect(px - 6, dy + 14, 124, 14, '#d8cdb8') + rect(px - 6, dy + 26, 124, 3, C.pcLo);
  for (let k = 0; k < 14; k++) b += rect(px - 2 + k * 8.5, dy + 16, 6, 3, '#f1e9da') + rect(px - 2 + k * 8.5, dy + 21, 6, 3, k > 2 && k < 11 ? '#f1e9da' : '#8f836f');
  b += `<ellipse cx="${px + 142}" cy="${dy + 22}" rx="12" ry="6" fill="${C.pcHi}"/>`;
  // lamp, its pool of light, dust in the beam
  const lx = 300;
  b += `<ellipse cx="${lx + 110}" cy="${dy + 34}" rx="104" ry="22" fill="#e2a44c" opacity=".22" class="flick"/><ellipse cx="${lx + 110}" cy="${dy + 34}" rx="70" ry="14" fill="#f0bb62" opacity=".32" class="flick"/><ellipse cx="${lx + 110}" cy="${dy + 34}" rx="38" ry="8" fill="#ffd88f" opacity=".4" class="flick"/>`;
  b += `<path d="M${lx + 52} ${dy - 64}L${lx + 20} ${dy + 30}H${lx + 200}L${lx + 100} ${dy - 72}Z" fill="url(#cone)" class="flick"/>`;
  for (let i = 0; i < 10; i++) b += rect(lx + 40 + Math.floor(rand() * 120), dy - 50 + Math.floor(rand() * 60), 2, 2, C.warm, `class="mote" style="animation-delay:${r2(-rand() * 8)}s;animation-duration:${r2(6 + rand() * 5)}s"`);
  b += `<ellipse cx="${lx}" cy="${dy + 4}" rx="22" ry="5" fill="#d9d0c4"/><path d="M${lx} ${dy + 2}L${lx - 12} ${dy - 84}L${lx + 56} ${dy - 92}" stroke="#d9d0c4" stroke-width="3" fill="none"/><circle cx="${lx - 12}" cy="${dy - 84}" r="4" fill="${K.line2}"/>`;
  b += `<path d="M${lx + 50} ${dy - 62}a26 28 0 0 1 52 -10z" fill="#bfb5a8"/><path d="M${lx + 50} ${dy - 62}l52 -10l-5 9z" fill="${C.warm}" class="flick"/>`;
  // plant, pencils, mug with steam, tray, the collection book
  b += bitmap(['..g..g...', '.gg.gg.g.', 'ggggggggg', '.ggdgggg.', 'gggggdgg.', '.gdggggg.', '..gg.gg..', '...g.g...'], 236, dy - 62, 4, { g: '#2c4a31', d: '#1f3525' });
  b += rect(248, dy - 30, 20, 32, '#59606f') + rect(248, dy - 30, 20, 3, '#6d7484') + rect(252, dy - 38, 3, 8, '#d9b44a') + rect(258, dy - 40, 3, 10, '#c8532f');
  const gx = 326;
  b += rect(gx, dy - 24, 22, 26, '#d8cdbd') + rect(gx, dy - 24, 22, 3, '#57634f') + rect(gx - 6, dy - 18, 6, 3, '#d8cdbd') + rect(gx - 6, dy - 18, 3, 12, '#d8cdbd') + rect(gx - 6, dy - 8, 6, 3, '#d8cdbd');
  for (let i = 0; i < 3; i++) b += rect(gx + 4 + i * 6, dy - 34, 3, 6, K.dim, `class="steam" style="animation-delay:${i * 0.9}s"`);
  b += rect(lx + 150, dy + 22, 36, 5, '#6fa7a0') + rect(lx + 150, dy + 27, 36, 2, '#4f817b');
  b += `<g transform="rotate(-5 600 430)">${rect(556, 404, 96, 46, '#efe9e0')}${rect(556, 404, 96, 12, K.green)}${rect(572, 407, 6, 6, '#fff')}${rect(584, 407, 6, 6, '#fff')}${rect(574, 409, 2, 2, '#33312F')}${rect(586, 409, 2, 2, '#33312F')}${textAt('COLLECTION', { x: 562, y: 422, s: 1, fill: '#33312F' })}${textAt('BOOK', { x: 562, y: 433, s: 1, fill: '#33312F' })}</g>`;
  b += textAt("RIPPER'S GAMES", { x: 716, y: H - 28, s: 2, fill: K.faint }) ;

  const css = `
  .tw{animation:tw 3.4s ease-in-out infinite}@keyframes tw{0%,100%{opacity:.1}50%{opacity:.8}}
  .rain{animation:rain 1s linear infinite}@keyframes rain{from{transform:translateY(-10px)}to{transform:translateY(80px)}}
  .lit{animation:lit 7s steps(1) infinite}@keyframes lit{52%{opacity:.8}54%{opacity:1}}
  .tick{animation:tick 60s steps(60) infinite}@keyframes tick{to{transform:rotate(360deg)}}
  .drop{animation:drop .6s cubic-bezier(.16,1,.3,1) both}@keyframes drop{from{transform:translateY(-40px);opacity:0}}
  .fade{animation:fade .4s ease-out both}@keyframes fade{from{opacity:0}}
  .type{transform-box:fill-box;transform-origin:100% 50%;animation:type 1.2s steps(32) .95s forwards}@keyframes type{to{transform:scaleX(0)}}
  .flick{animation:flick 6s steps(1) infinite}@keyframes flick{47%{opacity:.25}49%{opacity:.4}}
  .mote{animation:mote 8s linear infinite}@keyframes mote{0%{transform:translate(0,0);opacity:0}15%{opacity:.8}85%{opacity:.6}100%{transform:translate(14px,-34px);opacity:0}}
  .pulse{animation:pulse 4s ease-in-out infinite}@keyframes pulse{50%{opacity:.7}}
  .code{opacity:0;animation:code 9s steps(1) infinite}@keyframes code{0%{opacity:0}4%,90%{opacity:1}100%{opacity:0}}
  .blink{animation:blink 1s steps(1) infinite}@keyframes blink{50%{opacity:0}}
  .steam{opacity:0;animation:steam 2.7s ease-out infinite}@keyframes steam{0%{opacity:0;transform:translateY(0)}30%{opacity:.7}100%{opacity:0;transform:translateY(-22px)}}
  ${REDUCE}`;
  const defs = `
  <clipPath id="c"><path d="${cutPath(W, H)}"/></clipPath><clipPath id="win"><rect x="${wx}" y="${wy}" width="${ww}" height="${wh}"/></clipPath>
  <linearGradient id="cone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff1cf" stop-opacity=".26"/><stop offset="1" stop-color="#fff1cf" stop-opacity=".02"/></linearGradient>
  <radialGradient id="glow"><stop offset="0" stop-color="${K.opal}" stop-opacity=".16"/><stop offset="1" stop-color="${K.opal}" stop-opacity="0"/></radialGradient>`;
  return svg(W, H, `<g clip-path="url(#c)">${b}</g><path d="${cutPath(W - 1, H - 1)}" transform="translate(.5 .5)" fill="none" stroke="${K.line}"/>`, {
    title: "ripper. i don't play games. i make them. games, apps and tools, start to finish. ripper's games.", defs, style: css,
  });
}

// ------------------------------------------------------ build a brick set --
function brickset() {
  const W = 880, H = 300;
  const C = { cream: '#FFF5E0', ink: '#33312F', muted: '#5F5A52' };
  let b = rect(0, 0, W, H, C.cream) + rect(0, 0, W, H, 'none', `stroke="${C.ink}" stroke-width="8"`);
  // kraft stage on the left: pip watching a set get built, one piece at a time
  b += rect(4, 4, 330, H - 8, K.kraft) + rect(330, 4, 4, H - 8, C.ink) + rect(4, H - 60, 326, 56, K.kraftLo) + rect(4, H - 60, 326, 4, C.ink);
  const p = pip(34, H - 60 - 29 * 4 + 4, 4, 'q');
  b += p.body;
  const bx = 212, by = H - 60 - 16;
  const tower = [
    [0, 0, 4, '#5f8fc4', '#86addb', '#44709f'], [0, -20, 2, '#8b5a3c', '#a97552', '#6b4229'], [24, -20, 2, '#f3ece4', '#ffffff', '#cfc6bb'],
    [0, -40, 4, '#5f8fc4', '#86addb', '#44709f'], [12, -60, 2, '#d7553f', '#ea7a66', '#b03f2c'],
  ];
  tower.forEach(([dx, dy, n, c, hi, lo], i) => (b += `<g class="pc" style="animation-delay:${r2(0.6 + i * 1.3)}s">${brick(bx + dx, by + dy, n, c, hi, lo)}</g>`));
  b += rect(W - 150, 4, 146, 30, C.ink) + textAt('MAIN PROJECT', { x: W - 77, y: 12, s: 2, fill: C.cream, anchor: 'middle' });
  const x = 366;
  b += textAt('BUILD A', { x, y: 34, s: 3, fill: C.ink }) + textAt('BRICK SET', { x, y: 64, s: 6, fill: C.ink });
  b += textAt('OPEN THE BOX. TEAR THE BAGS.', { x, y: 128, s: 2, fill: C.ink }) + textAt('PRESS EVERY PIECE ON.', { x, y: 150, s: 2, fill: C.ink });
  b += textAt('A CALM ROBLOX GAME ABOUT BUILDING', { x, y: 184, s: 2, fill: C.muted }) + textAt('BOXED BRICK SETS BY HAND. NO TIMERS.', { x, y: 204, s: 2, fill: C.muted });
  let cx = x;
  for (const [t, fill] of [['IN DEVELOPMENT', K.seal], ['ROBLOX', '#fff'], ['LUAU', '#fff'], ['BLENDER', '#fff']]) {
    const w = textWidth(t, 2) + 20;
    b += rect(cx + 4, 244 + 4, w, 28, C.ink) + rect(cx, 244, w, 28, fill, `stroke="${C.ink}" stroke-width="3"`) + textAt(t, { x: cx + 10, y: 251, s: 2, fill: C.ink });
    cx += w + 14;
  }
  const css = `${p.css}
  .pc{animation:pc 9s cubic-bezier(.16,1,.3,1) infinite both}@keyframes pc{0%{transform:translateY(-70px);opacity:0}5%{opacity:1}9%,88%{transform:translateY(0);opacity:1}94%,100%{opacity:0;transform:translateY(0)}}
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
  // strut: real pieces from its demo closet, hanging on the rail
  let a = '';
  const P = SP.palettes;
  a += rect(0, 40, 150, 3, '#BBB3A7');
  [['polo_rust', 28], ['sweater_cream', 75], ['jacket_denim', 122]].forEach(([n, hx], i) => {
    const sp = SP[n], s = 1.4, w = sp[0].length * s;
    a += `<g class="sway" style="transform-origin:${hx}px 42px;animation-delay:${-i * 0.9}s"><path d="M${hx} 42v8M${hx - 15} 64L${hx} 50L${hx + 15} 64" stroke="#BBB3A7" stroke-width="2.5" fill="none"/>${bitmap(sp, r2(hx - w / 2), 58, s, P[n])}</g>`;
  });
  a += centered(SP.strut, 1.75, { o: '#F0532B' }, 75, 190);
  out.strut = card({ title: 'STRUT', tag: 'IN DEVELOPMENT', accent: '#F0532B', lines: ['AN AI WARDROBE FOR', 'THE CLOSET YOU', 'ALREADY OWN.'], meta: 'ANDROID, KOTLIN, COMPOSE',
    art: { body: a, css: '.sway{animation:sway 4.5s ease-in-out infinite}@keyframes sway{0%,100%{transform:rotate(-2.5deg)}50%{transform:rotate(2.5deg)}}' } });

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
for (const [n, c] of Object.entries(files)) {
  writeFileSync(join(out, `${n}.svg`), c);
  console.log(n, (c.length / 1024).toFixed(0) + 'kb');
}
