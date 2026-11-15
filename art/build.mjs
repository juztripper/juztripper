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
  let css = '';
  let b = '';

  // wall with faint paper grain
  b += rect(0, 0, W, H, K.ground);
  for (let i = 0; i < 150; i++) b += rect(Math.floor(rand() * 220) * 4, Math.floor(rand() * 80) * 4, 4, 4, rand() < 0.5 ? '#121210' : '#0a0a09');

  // window, night outside
  const wx = 624, wy = 44, ww = 200, wh = 132;
  b += rect(wx - 8, wy - 8, ww + 16, wh + 16, K.line) + rect(wx, wy, ww, wh, K.deep);
  for (let i = 0; i < 26; i++) {
    const s = rand() < 0.25 ? 4 : 2;
    b += rect(wx + 6 + Math.floor(rand() * (ww - 14)), wy + 6 + Math.floor(rand() * (wh - 14)), s, s, K.ink, `opacity="${r2(0.3 + rand() * 0.6)}" class="tw" style="animation-delay:${r2(rand() * 4)}s"`);
  }
  b += bitmap(['..mmmm.', '.mmm...', 'mmm....', 'mmm....', 'mmm....', '.mmm...', '..mmmm.'], wx + 140, wy + 18, 4, { m: K.ink });
  b += `<g class="star"><path d="M${wx + 30} ${wy + 20}h28v2h-28z" fill="${K.opal}"/></g>`;
  b += rect(wx + ww / 2 - 3, wy, 6, wh, K.line) + rect(wx, wy + wh / 2 - 3, ww, 6, K.line) + rect(wx - 14, wy + wh + 8, ww + 28, 8, K.line2);

  // name, built from blocks, with a folded-paper extrusion
  const NAME = 'RIPPER', S = 12, nx = 56, ny = 52;
  textGlyphs(NAME, nx, ny, S).forEach((g, i) => {
    let l = '';
    for (let k = 4; k >= 1; k--) l += `<path d="${g.d}" transform="translate(${k * 3} ${k * 3})" fill="${k > 2 ? '#24231f' : '#3d3b36'}"/>`;
    l += `<path d="${g.d}" fill="${K.ink}"/>`;
    b += `<g class="drop" style="animation-delay:${r2(0.15 + i * 0.08)}s">${l}</g>`;
  });
  const t1 = "I DON'T PLAY GAMES. I MAKE THEM.";
  const ty = ny + 7 * S + 30;
  b += `<g class="fade" style="animation-delay:.9s">${textAt(t1, { x: nx, y: ty, s: 2, fill: K.ink })}</g>`;
  b += `<rect class="type" x="${nx - 2}" y="${ty - 4}" width="${textWidth(t1, 2) + 6}" height="22" fill="${K.ground}"/>`;
  b += `<g class="fade" style="animation-delay:2.2s">${textAt('GAMES, APPS AND TOOLS. START TO FINISH.', { x: nx, y: ty + 26, s: 2, fill: K.faint })}</g>`;

  // desk
  const dy = 378;
  b += rect(24, dy, W - 48, 10, K.wood) + rect(24, dy, W - 48, 3, K.woodHi) + rect(32, dy + 10, W - 64, 34, K.woodLo) + rect(32, dy + 10, W - 64, 3, '#16120f');
  b += rect(52, dy + 44, 14, H - dy - 44, K.woodLo) + rect(W - 66, dy + 44, 14, H - dy - 44, K.woodLo);

  // lamp, its cone of light, dust in the light
  const lx = 300;
  b += `<path d="M${lx + 14} ${dy - 78}L${lx - 150} ${dy}H${lx + 150}L${lx + 62} ${dy - 78}Z" fill="url(#cone)" class="flick"/>`;
  for (let i = 0; i < 12; i++) {
    const x = lx - 80 + Math.floor(rand() * 200), y = dy - 68 + Math.floor(rand() * 56);
    b += rect(x, y, 2, 2, '#fff1cf', `class="mote" style="animation-delay:${r2(-rand() * 8)}s;animation-duration:${r2(6 + rand() * 5)}s"`);
  }
  b += rect(lx + 96, dy - 6, 44, 6, K.line2) + rect(lx + 114, dy - 86, 6, 80, K.line2);
  b += `<path d="M${lx + 117} ${dy - 84}L${lx + 62} ${dy - 98}" stroke="${K.line2}" stroke-width="6"/>`;
  b += `<path d="M${lx + 20} ${dy - 104}h52l14 26h-80z" fill="${K.raised}" stroke="${K.line2}" stroke-width="2"/>` + rect(lx + 14, dy - 78, 64, 4, '#fff1cf', 'class="flick"');

  // a sealed brick set, pip sitting on it, and a few loose bricks
  const bx = 96, bw = 132, bh = 62;
  b += rect(bx, dy - bh, bw, bh, K.kraft) + rect(bx, dy - bh, bw, 4, '#e0bb8c') + rect(bx, dy - 8, bw, 8, K.kraftLo) + rect(bx + bw - 6, dy - bh, 6, bh, K.kraftLo);
  b += rect(bx, dy - 28, bw, 3, '#2a2826') + `<circle cx="${bx + 26}" cy="${dy - 27}" r="11" fill="${K.seal}" stroke="#2a2826" stroke-width="3"/>`;
  b += textAt('MAILBOX', { x: bx + 10, y: dy - bh + 10, s: 2, fill: '#2a2826' });
  const p = pip(bx + 18, dy - bh - 29 * 3 + 3, 3);
  b += p.body;
  css += p.css;
  b += brick(250, dy - 16, 4, '#5f8fc4', '#86addb', '#44709f') + brick(262, dy - 36, 2, '#f3ece4', '#ffffff', '#cfc6bb');
  b += `<g class="press">${brick(286, dy - 36, 2, K.green, '#7fd07c', '#3a8f3d')}</g>`;

  // monitor with code typing itself
  const mx = 470, my = dy - 134, mw = 190, mh = 112;
  b += `<ellipse cx="${mx + mw / 2}" cy="${my + mh / 2}" rx="170" ry="110" fill="url(#glow)" class="pulse"/>`;
  b += rect(mx - 8, my - 8, mw + 16, mh + 16, K.line2) + rect(mx - 4, my - 4, mw + 8, mh + 8, K.raised) + rect(mx, my, mw, mh, K.deep);
  b += rect(mx + mw / 2 - 10, my + mh + 8, 20, dy - my - mh - 14, K.line2) + rect(mx + mw / 2 - 40, dy - 6, 80, 6, K.line2);
  const code = [[0, 40, K.opal], [0, 24, K.dim, 48, 56, K.ink], [12, 70, K.dim], [12, 30, K.ink, 48, 44, K.opal], [24, 52, K.dim], [12, 18, K.dim], [0, 28, K.opal, 34, 60, K.dim], [12, 64, K.ink], [0, 12, K.dim]];
  code.forEach((ln, i) => {
    let row = '';
    for (let j = 0; j < ln.length; j += 3) row += rect(mx + 12 + ln[j], my + 12 + i * 10, ln[j + 1], 4, ln[j + 2]);
    b += `<g class="code" style="animation-delay:${r2(i * 0.55)}s">${row}</g>`;
  });
  b += rect(mx + 30, my + 12 + 8 * 10, 6, 6, K.opal, 'class="blink"');
  // keyboard, mug with steam
  b += rect(mx + 20, dy - 5, 130, 5, K.line2) + rect(mx + 24, dy - 7, 122, 2, K.faint);
  const gx = 706;
  b += rect(gx, dy - 30, 28, 30, K.ink) + rect(gx, dy - 30, 28, 4, '#fff') + rect(gx + 28, dy - 24, 8, 4, K.ink) + rect(gx + 32, dy - 24, 4, 16, K.ink) + rect(gx + 28, dy - 12, 8, 4, K.ink) + rect(gx + 4, dy - 18, 20, 3, K.opal);
  for (let i = 0; i < 3; i++) b += rect(gx + 6 + i * 7, dy - 40, 3, 6, K.dim, `class="steam" style="animation-delay:${i * 0.9}s"`);
  // footer strip
  b += textAt("RIPPER'S GAMES", { x: 86, y: H - 26, s: 2, fill: K.faint }) + textAt('PORTUGAL', { x: W - 86, y: H - 26, s: 2, fill: K.faint, anchor: 'end' });

  css += `
  .tw{animation:tw 3.4s ease-in-out infinite}@keyframes tw{0%,100%{opacity:.15}50%{opacity:1}}
  .star{opacity:0;animation:star 11s linear 3s infinite}@keyframes star{0%{opacity:0;transform:translate(0,0)}2%{opacity:1}7%{opacity:0;transform:translate(110px,36px)}100%{opacity:0}}
  .drop{animation:drop .6s cubic-bezier(.16,1,.3,1) both}@keyframes drop{from{transform:translateY(-40px);opacity:0}}
  .fade{animation:fade .4s ease-out both}@keyframes fade{from{opacity:0}}
  .type{transform-box:fill-box;transform-origin:100% 50%;animation:type 1.2s steps(32) .95s forwards}@keyframes type{to{transform:scaleX(0)}}
  .flick{animation:flick 6s steps(1) infinite}@keyframes flick{0%,100%{opacity:1}47%{opacity:.82}49%{opacity:1}71%{opacity:.9}72%{opacity:1}}
  .mote{animation:mote 8s linear infinite}@keyframes mote{0%{transform:translate(0,0);opacity:0}15%{opacity:.8}85%{opacity:.6}100%{transform:translate(14px,-34px);opacity:0}}
  .pulse{animation:pulse 4s ease-in-out infinite}@keyframes pulse{50%{opacity:.7}}
  .code{opacity:0;animation:code 9s steps(1) infinite}@keyframes code{0%{opacity:0}4%,90%{opacity:1}100%{opacity:0}}
  .blink{animation:blink 1s steps(1) infinite}@keyframes blink{50%{opacity:0}}
  .steam{opacity:0;animation:steam 2.7s ease-out infinite}@keyframes steam{0%{opacity:0;transform:translateY(0)}30%{opacity:.7}100%{opacity:0;transform:translateY(-22px)}}
  .press{animation:press 5s cubic-bezier(.16,1,.3,1) infinite}@keyframes press{0%,12%{transform:translateY(-46px);opacity:0}20%{opacity:1}34%,100%{transform:translateY(0);opacity:1}}
  ${REDUCE}`;
  const defs = `
  <clipPath id="c"><path d="${cutPath(W, H)}"/></clipPath>
  <linearGradient id="cone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff1cf" stop-opacity=".34"/><stop offset="1" stop-color="#fff1cf" stop-opacity=".04"/></linearGradient>
  <radialGradient id="glow"><stop offset="0" stop-color="${K.opal}" stop-opacity=".2"/><stop offset="1" stop-color="${K.opal}" stop-opacity="0"/></radialGradient>`;
  return svg(W, H, `<g clip-path="url(#c)">${b}</g><path d="${cutPath(W - 1, H - 1)}" transform="translate(.5 .5)" fill="none" stroke="${K.line}"/>`, {
    title: "ripper. i don't play games. i make them. games, apps and tools, start to finish. ripper's games, portugal.", defs, style: css,
  });
}

// ------------------------------------------------------ build a brick set --
function brickset() {
  const W = 880, H = 340;
  const C = { cream: '#FFF5E0', ink: '#33312F', muted: '#5F5A52', wall: '#5b3f3c', wallLo: '#4d3431', desk: '#38231f', deskHi: '#4c302a', frame: '#b2958e', frameLo: '#8f746e', sky: '#6d6577', house: '#8b7d89', roof: '#676280', curtain: '#57634f', curtainLo: '#465140', pc: '#cdbfa8', pcLo: '#a99b85', pcHi: '#e2d6c1' };
  const rand = rng(5);
  let b = rect(0, 0, W, H, C.wall) + rect(0, 0, W, 60, C.wallLo, 'opacity=".5"');
  // the window: the house across the street, two lit rooms, rain
  const wx = 78, wy = 44, ww = 264, wh = 170;
  b += rect(wx - 8, wy - 8, ww + 16, wh + 16, C.frame) + rect(wx - 8, wy + wh, ww + 16, 8, C.frameLo);
  let out = rect(wx, wy, ww, wh, C.sky) + `<path d="M${wx + 10} ${wy + 70}L${wx + 80} ${wy + 6}H${wx + 220}L${wx + 264} ${wy + 60}V${wy + 70}Z" fill="${C.roof}"/>` + rect(wx + 20, wy + 70, 244, 100, C.house);
  out += rect(wx, wy + 128, ww, 42, '#7a5763') + rect(wx, wy + 128, ww, 3, '#8c6672');
  out += `<circle cx="${wx + 24}" cy="${wy + 104}" r="34" fill="#8a4f3c" opacity=".75"/><circle cx="${wx + 6}" cy="${wy + 128}" r="26" fill="#74402f" opacity=".75"/>`;
  for (const [x, w] of [[70, 26], [124, 40]]) out += rect(wx + x - 8, wy + 76, w + 16, 46, '#fff6e0', 'opacity=".16" class="lit"') + rect(wx + x - 3, wy + 81, w + 6, 36, '#fff6e0', 'opacity=".35" class="lit"') + rect(wx + x, wy + 84, w, 30, '#fffaf0', 'class="lit"');
  out += rect(wx + 196, wy + 86, 22, 26, '#6d6577') + rect(wx + 206, wy + 86, 2, 26, C.house);
  for (let i = 0; i < 46; i++) out += rect(wx + Math.floor(rand() * ww), wy - 20 + Math.floor(rand() * wh), 1.5, 9, '#d9dcf0', `opacity="${r2(0.25 + rand() * 0.4)}" class="rain" style="animation-delay:${r2(-rand() * 1.2)}s;animation-duration:${r2(0.7 + rand() * 0.5)}s"`);
  b += `<g clip-path="url(#win)">${out}</g>`;
  b += rect(wx + 84, wy, 7, wh, C.frame) + rect(wx + 178, wy, 7, wh, C.frame) + rect(wx + 86, wy + 90, 3, 12, C.ink) + rect(wx + 180, wy + 90, 3, 12, C.ink);
  // curtains and rod
  b += rect(28, 22, 364, 5, C.desk) + rect(22, 19, 10, 11, C.desk) + rect(388, 19, 10, 11, C.desk);
  for (const cx of [44, 336]) { b += rect(cx, 27, 42, 206, C.curtain); for (let k = 0; k < 4; k++) b += rect(cx + 6 + k * 10, 27, 4, 206, C.curtainLo); }
  // shelf with two finished sets and their labels
  const sy = 200;
  b += rect(86, sy, 250, 5, '#2b1a17') + rect(96, sy + 5, 4, 10, '#2b1a17') + rect(322, sy + 5, 4, 10, '#2b1a17');
  b += bitmap(['..r...', '.bbbb.', '.bbbb.', '..k...', '..w...', 'gyggwg'], 222, sy - 24, 4, { r: '#d7553f', b: '#3f6fa8', k: '#5a3b2a', w: '#e9e2d8', g: '#5d9a54', y: '#d9b44a' });
  b += bitmap(['g.......', 'g..bbbb.', 'gg.wwwwr', 'ggbbbbbb', 'gkyk.kyk'], 276, sy - 20, 4, { g: '#3f7a45', b: '#7fa3cf', w: '#e9e2d8', r: '#d7553f', k: '#33312F', y: '#d9b44a' });
  for (const lx of [220, 280]) b += rect(lx, sy + 5, 30, 11, '#efe9e0') + rect(lx + 3, sy + 8, 16, 2, C.ink) + rect(lx + 3, sy + 12, 10, 1, C.muted);
  // desk
  const dy = 252;
  b += rect(0, dy, W, H - dy, C.desk) + rect(0, dy, W, 4, C.deskHi);
  // plant, pencil cup, mug
  b += bitmap(['..g..g...', '.gg.gg.g.', 'ggggggggg', '.ggdgggg.', 'gggggdgg.', '.gdggggg.', '..gg.gg..', '...g.g...'], 92, dy - 62, 4, { g: '#2f4a33', d: '#22382a' });
  b += rect(104, dy - 32, 20, 32, '#59606f') + rect(104, dy - 32, 20, 3, '#6d7484') + rect(108, dy - 40, 3, 8, '#d9b44a') + rect(114, dy - 42, 3, 10, '#c8532f');
  b += rect(176, dy - 26, 22, 26, '#d8cdbd') + rect(176, dy - 26, 22, 3, '#57634f') + rect(170, dy - 20, 6, 3, '#d8cdbd') + rect(170, dy - 20, 3, 12, '#d8cdbd') + rect(170, dy - 10, 6, 3, '#d8cdbd');
  // the lamp and its pool of light
  b += `<ellipse cx="262" cy="${dy + 26}" rx="92" ry="20" fill="#e2a44c" opacity=".28" class="flick"/><ellipse cx="262" cy="${dy + 26}" rx="62" ry="13" fill="#f0bb62" opacity=".4" class="flick"/><ellipse cx="262" cy="${dy + 26}" rx="34" ry="7" fill="#ffd88f" opacity=".45" class="flick"/>`;
  b += `<ellipse cx="150" cy="${dy + 2}" rx="20" ry="5" fill="#d9d0c4"/><path d="M150 ${dy}L140 176L200 168" stroke="#d9d0c4" stroke-width="3" fill="none"/><circle cx="140" cy="176" r="4" fill="${C.ink}"/>`;
  b += `<path d="M196 196a24 26 0 0 1 48 -8z" fill="#bfb5a8"/><path d="M196 196l48 -8l-4 8z" fill="#fff1cf" class="flick"/>`;
  b += rect(296, dy + 14, 34, 5, '#6fa7a0') + rect(296, dy + 19, 34, 2, '#4f817b');
  // the collection book
  b += `<g transform="rotate(-4 60 312)">${rect(14, 290, 92, 44, '#efe9e0')}${rect(14, 290, 92, 12, K.green)}${rect(30, 293, 6, 6, '#fff')}${rect(42, 293, 6, 6, '#fff')}${rect(32, 295, 2, 2, C.ink)}${rect(44, 295, 2, 2, C.ink)}${textAt('COLLECTION', { x: 20, y: 308, s: 1, fill: C.ink })}${textAt('BOOK', { x: 20, y: 319, s: 1, fill: C.ink })}</g>`;
  // wall: frames and a clock that ticks
  b += rect(404, 84, 30, 38, '#cbbdb6') + rect(408, 88, 22, 30, '#efe9e0') + bitmap(['w.w.', 'gggg', 'gggg'], 411, 98, 4, { w: '#fff', g: K.green });
  b += rect(444, 84, 30, 38, '#cbbdb6') + rect(448, 88, 22, 30, '#a9c3d6') + bitmap(['.gg.', 'gggg', '.k..', 'bbbb'], 451, 94, 4, { g: '#5d9a54', k: '#5a3b2a', b: '#3f6fa8' });
  b += `<circle cx="510" cy="74" r="20" fill="#5a3b2a"/><circle cx="510" cy="74" r="16" fill="#efe9e0"/><path d="M510 74L518 70" stroke="${C.ink}" stroke-width="2.5"/><path d="M510 74V61" stroke="${C.ink}" stroke-width="1.5" class="tick" style="transform-origin:510px 74px"/>`;
  // the old computer, pip asleep on it
  const px = 398, py = 140;
  b += rect(px, py, 126, 106, C.pc) + rect(px, py, 126, 4, C.pcHi) + rect(px, py + 98, 126, 8, C.pcLo) + rect(px + 84, py + 6, 2, 80, C.pcLo);
  b += rect(px + 8, py + 10, 72, 70, '#17130f') + `<rect x="${px + 12}" y="${py + 14}" width="64" height="62" rx="6" fill="#050505"/>`;
  b += `<ellipse cx="${px + 44}" cy="${py + 52}" rx="30" ry="22" fill="${K.green}" opacity=".12" class="glow"/>`;
  b += `<g class="breathe" style="transform-origin:${px + 44}px ${py + 70}px">${bitmap(SP['pip-asleep'], px + 16, py + 32, 1.4, { g: '#5fd15c', d: '#3fae47', w: '#b9f0b0', k: '#0c1a0c', l: '#b9f0b0' })}</g>`;
  [[58, 30, 1], [63, 22, 1.5], [69, 12, 2]].forEach(([zx, zy, s], i) => (b += `<g class="zz" style="animation-delay:${i * 0.7}s">${textAt('Z', { x: px + zx, y: py + zy, s, fill: '#e8f5e4' })}</g>`));
  b += rect(px + 92, py + 14, 26, 5, '#8f836f') + rect(px + 94, py + 22, 6, 2, K.green) + `<circle cx="${px + 98}" cy="${py + 42}" r="5" fill="#6f6557"/><circle cx="${px + 112}" cy="${py + 42}" r="5" fill="#6f6557"/>`;
  for (let k = 0; k < 5; k++) b += rect(px + 92, py + 56 + k * 5, 26, 2, C.pcLo);
  b += rect(px + 106, py + 86, 12, 9, '#e0a020') + rect(px + 10, py + 86, 12, 9, '#efe9e0') + rect(px + 12, py + 90, 8, 4, K.green);
  b += rect(px - 8, dy + 10, 112, 14, '#d8cdb8') + rect(px - 8, dy + 22, 112, 3, C.pcLo);
  for (let k = 0; k < 13; k++) b += rect(px - 4 + k * 8, dy + 12, 6, 3, '#f1e9da') + rect(px - 4 + k * 8, dy + 17, 6, 3, k > 2 && k < 10 ? '#f1e9da' : '#8f836f');
  b += `<ellipse cx="${px + 124}" cy="${dy + 18}" rx="12" ry="6" fill="#e2d6c1"/>`;
  // the room picker from the game
  const ux = 150, uy = 292;
  b += `<rect x="${ux + 3}" y="${uy + 3}" width="236" height="34" rx="9" fill="${C.ink}"/><rect x="${ux}" y="${uy}" width="236" height="34" rx="9" fill="${C.cream}" stroke="${C.ink}" stroke-width="3"/>`;
  for (const [ax, ch] of [[ux + 19, '<'], [ux + 217, '>']]) b += `<circle cx="${ax}" cy="${uy + 17}" r="10" fill="${K.seal}" stroke="${C.ink}" stroke-width="2.5"/>` + textAt(ch, { x: ax - 4, y: uy + 10, s: 2, fill: C.ink });
  b += textAt('RAINY NIGHT', { x: ux + 118, y: uy + 10, s: 2, fill: C.ink, anchor: 'middle' });
  // info card, in the game's own sticker style
  const ix = 560, iy = 22, iw = 298, ih = 296;
  b += `<rect x="${ix + 5}" y="${iy + 5}" width="${iw}" height="${ih}" rx="14" fill="${C.ink}"/><rect x="${ix}" y="${iy}" width="${iw}" height="${ih}" rx="14" fill="${C.cream}" stroke="${C.ink}" stroke-width="4"/>`;
  const tx = ix + 22;
  b += `<rect x="${tx}" y="${iy + 18}" width="${textWidth('MAIN PROJECT', 2) + 18}" height="24" rx="6" fill="${C.ink}"/>` + textAt('MAIN PROJECT', { x: tx + 9, y: iy + 23, s: 2, fill: C.cream });
  b += textAt('BUILD A', { x: tx, y: iy + 58, s: 3, fill: C.ink }) + textAt('BRICK SET', { x: tx, y: iy + 86, s: 5, fill: C.ink });
  ['OPEN THE BOX.', 'TEAR THE BAGS.', 'PRESS EVERY PIECE ON.'].forEach((l, i) => (b += textAt(l, { x: tx, y: iy + 140 + i * 20, s: 2, fill: C.ink })));
  b += textAt('A CALM ROBLOX GAME.', { x: tx, y: iy + 208, s: 2, fill: C.muted }) + textAt('NO TIMERS.', { x: tx, y: iy + 228, s: 2, fill: C.muted });
  let cx = tx;
  for (const [t, fill] of [['IN DEVELOPMENT', K.seal], ['ROBLOX', '#fff']]) {
    const w = textWidth(t, 2) + 18;
    b += `<rect x="${cx + 3}" y="${iy + 259}" width="${w}" height="24" rx="12" fill="${C.ink}"/><rect x="${cx}" y="${iy + 256}" width="${w}" height="24" rx="12" fill="${fill}" stroke="${C.ink}" stroke-width="2.5"/>` + textAt(t, { x: cx + 9, y: iy + 261, s: 2, fill: C.ink });
    cx += w + 10;
  }
  const css = `
  .rain{animation:rain 1s linear infinite}@keyframes rain{from{transform:translateY(-10px)}to{transform:translateY(70px)}}
  .lit{animation:lit 7s steps(1) infinite}@keyframes lit{0%,100%{opacity:1}52%{opacity:.86}54%{opacity:1}}
  .flick{animation:flick 6s steps(1) infinite}@keyframes flick{47%{opacity:.3}49%{opacity:.42}}
  .tick{animation:tick 60s steps(60) infinite}@keyframes tick{to{transform:rotate(360deg)}}
  .glow{animation:glow 4s ease-in-out infinite}@keyframes glow{50%{opacity:.22}}
  .breathe{animation:breathe 4s ease-in-out infinite}@keyframes breathe{50%{transform:scaleY(1.04)}}
  .zz{opacity:0;animation:zz 2.1s ease-out infinite}@keyframes zz{0%{opacity:0;transform:translate(0,4px)}30%{opacity:1}100%{opacity:0;transform:translate(4px,-8px)}}
  ${REDUCE}`;
  return svg(W, H, b + rect(1.5, 1.5, W - 3, H - 3, 'none', `stroke="${C.ink}" stroke-width="3"`), {
    title: 'build a brick set, my main project. a calm roblox game: open the box, tear the bags, press every piece on. in development.',
    defs: `<clipPath id="win"><rect x="${wx}" y="${wy}" width="${ww}" height="${wh}"/></clipPath>`, style: css,
  });
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
  // strut: real pieces from its demo closet, laid out as looks that swap like the app's suggestions
  let a = rect(0, 0, 150, 236, '#FAF8F5');
  const looks = [['polo_rust', 'jeans_mid', 'sneakers_white'], ['sweater_cream', 'trousers_charcoal', 'boots_chelsea'], ['jacket_denim', 'chinos_beige', 'loafers_brown']];
  const P = SP.palettes;
  looks.forEach(([top, bottom, shoes], i) => {
    const g = centered(SP[bottom], 2, P[bottom], 75, 150) + centered(SP[top], 3, P[top], 75, 68) + centered(SP[shoes], 2, P[shoes], 75, 214);
    a += `<g class="look" style="animation-delay:${i * 3}s">${g}</g>`;
  });
  a += `<circle cx="128" cy="22" r="9" fill="#F0532B" class="heart"/>`;
  out.strut = card({ title: 'STRUT', tag: 'IN DEVELOPMENT', accent: '#F0532B', lines: ['AN AI WARDROBE FOR', 'THE CLOSET YOU', 'ALREADY OWN.'], meta: 'ANDROID, KOTLIN, COMPOSE',
    art: { body: a, css: '.look{opacity:0;animation:look 9s cubic-bezier(.16,1,.3,1) infinite}@keyframes look{0%{opacity:0;transform:translateX(18px)}4%,30%{opacity:1;transform:none}34%,100%{opacity:0;transform:translateX(-18px)}}.heart{animation:heart 3s cubic-bezier(.16,1,.3,1) infinite;transform-origin:128px 22px}@keyframes heart{0%,100%{transform:scale(.8)}12%{transform:scale(1.15)}30%{transform:scale(1)}}' } });

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
