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
  // strut: the wordmark on a rail of hangers that sway
  let a = '';
  a += rect(0, 46, 150, 3, '#BBB3A7');
  [28, 75, 122].forEach((hx, i) => {
    const c = ['#F0532B', '#FAF8F5', '#C9A54C'][i];
    a += `<g class="sway" style="transform-origin:${hx}px 48px;animation-delay:${-i * 0.7}s"><path d="M${hx} 48v10M${hx - 18} 76L${hx} 58L${hx + 18} 76" stroke="#BBB3A7" stroke-width="3" fill="none"/>${rect(hx - 18, 76, 36, 44 + i * 8, c)}${rect(hx - 18, 76, 36, 4, '#00000022')}</g>`;
  });
  a += centered(SP.strut, 1.75, { o: '#F0532B' }, 75, 190);
  out.strut = card({ title: 'STRUT', tag: 'IN DEVELOPMENT', accent: '#F0532B', lines: ['AN AI WARDROBE FOR', 'THE CLOSET YOU', 'ALREADY OWN.'], meta: 'ANDROID, KOTLIN, COMPOSE',
    art: { body: a, css: '.sway{animation:sway 4s ease-in-out infinite}@keyframes sway{0%,100%{transform:rotate(-3deg)}50%{transform:rotate(3deg)}}' } });

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
