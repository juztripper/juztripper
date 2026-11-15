import { C, TILES, svg, bitmap, textAt, textGlyphs, textWidth, rng, r2 } from './lib.mjs';

const W = 880;
const H = 400;
const T = 80; // tile size (16 px * 5)

const LINES = [
  'MAKING GAMES SINCE AGE 9',
  '7,000 PLAYERS. ONE ROBLOX GAME.',
  'SELF-TAUGHT, LEARNS BY REPHRASING',
  'TOOLS FOR PEOPLE WHO MAKE THINGS',
  'PORTUGAL → THE INTERNET',
];

export function hero() {
  const rand = rng(42);
  const pal = { 0: '#0d1739', 1: '#172a6e', 2: '#223f96', 3: '#2f57bd' };
  const palHot = { 0: C.cobaltDeep, 1: C.cobaltMid, 2: C.sky, 3: C.ochre };

  let defs = '';
  for (const [name, rows] of Object.entries(TILES)) {
    defs += `<g id="t-${name}">${bitmap(rows, 0, 0, 5, pal)}</g>`;
    defs += `<g id="h-${name}">${bitmap(rows, 0, 0, 5, palHot)}</g>`;
  }
  defs += `
  <clipPath id="card"><rect width="${W}" height="${H}" rx="18"/></clipPath>
  <radialGradient id="vig" cx="50%" cy="48%" r="70%">
    <stop offset="0" stop-color="${C.night}" stop-opacity=".92"/>
    <stop offset=".42" stop-color="${C.night}" stop-opacity=".66"/>
    <stop offset=".75" stop-color="${C.night}" stop-opacity=".2"/>
    <stop offset="1" stop-color="${C.night}" stop-opacity=".75"/>
  </radialGradient>
  <linearGradient id="glint" x1="0" x2="1">
    <stop offset="0" stop-color="#fff" stop-opacity="0"/>
    <stop offset=".5" stop-color="#fff" stop-opacity=".16"/>
    <stop offset="1" stop-color="#fff" stop-opacity="0"/>
  </linearGradient>`;

  // tile field: classic azulejo layout, flower tiles with a lattice border ring
  const cols = W / T;
  const rows = H / T;
  let tiles = '';
  let hot = '';
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const edge = false;
      const kind = 'rosette';
      const delay = r2((c + r) * 0.07);
      tiles += `<use href="#t-${kind}" x="${c * T}" y="${r * T}" class="pop" style="animation-delay:${delay}s"/>`;
      if (!edge && rand() < 0.16) {
        const d = r2(2 + rand() * 9);
        hot += `<use href="#h-${kind}" x="${c * T}" y="${r * T}" class="hot" style="animation-delay:${d}s;animation-duration:${r2(5 + rand() * 5)}s"/>`;
      }
    }
  }

  // big name with a chunky extrusion
  const NAME = 'RIPPER';
  const S = 16;
  const nw = textWidth(NAME, S);
  const nx = Math.round((W - nw) / 2 / S) * S - 6;
  const ny = 88;
  const letters = textGlyphs(NAME, nx, ny, S);
  let name = '';
  letters.forEach((g, i) => {
    const delay = r2(0.85 + i * 0.09);
    let layers = '';
    // dark outline so the letters sit cleanly on the tiles
    for (const [dx, dy] of [[-5, -5], [5, -5], [-5, 5], [17, 17], [17, 5], [5, 17]]) {
      layers += `<path d="${g.d}" transform="translate(${dx} ${dy})" fill="${C.night}"/>`;
    }
    for (let k = 4; k >= 1; k--) {
      layers += `<path d="${g.d}" transform="translate(${k * 3} ${k * 3})" fill="${k > 2 ? C.cobaltDeep : C.cobalt}"/>`;
    }
    layers += `<path d="${g.d}" fill="${C.glaze}"/>`;
    // ochre glaze line through the middle of each letter, like a painted tile stroke
    layers += `<path d="${g.d}" fill="${C.ochre}" clip-path="url(#band)"/>`;
    name += `<g class="drop" style="animation-delay:${delay}s">${layers}</g>`;
  });
  defs += `<clipPath id="band"><rect x="0" y="${ny + 3 * S}" width="${W}" height="${S}"/></clipPath>`;

  // typing panel
  const PS = 3;
  const px = 116;
  const pw = W - px * 2;
  const py = 262;
  const ph = 50;
  const tx = px + 22;
  const ty = py + 15;
  const promptW = textWidth('> ', PS);
  const lx = tx + promptW;
  const CH = 6 * PS; // advance per char (5 + 1 gap) for most glyphs

  const perChar = 0.055;
  const hold = 1.9;
  const gapT = 0.25;
  const spans = [];
  let t = 0;
  for (const line of LINES) {
    const n = [...line].length;
    spans.push({ line, start: t, typeEnd: t + n * perChar, end: t + n * perChar + hold });
    t += n * perChar + hold + gapT;
  }
  const total = t;
  const kt = (x) => (Math.min(1, Math.max(0, x / total))).toFixed(4);

  let typing = '';
  const curVals = [];
  const curKeys = [];
  spans.forEach((sp, i) => {
    const chars = [...sp.line];
    // per-char x stops (real glyph widths so the cursor hugs the text)
    const stops = [0];
    let acc = 0;
    chars.forEach((ch) => {
      acc += textWidth(ch, PS) + PS;
      stops.push(acc);
    });
    const vals = ['0'];
    const keys = ['0'];
    stops.forEach((w, k) => {
      if (k === 0) return;
      vals.push(String(w));
      keys.push(kt(sp.start + k * perChar));
    });
    vals.push('0');
    keys.push(kt(sp.end));
    if (Number(keys[keys.length - 1]) < 1) {
      vals.push('0');
      keys.push('1');
    }
    // make keyTimes strictly non-decreasing and starting at 0
    typing += `<clipPath id="ln${i}"><rect x="${lx}" y="${ty - 4}" height="${8 * PS + 8}" width="0"><animate attributeName="width" dur="${r2(total)}s" begin="1.7s" repeatCount="indefinite" calcMode="discrete" values="${vals.join(';')}" keyTimes="${keys.join(';')}"/></rect></clipPath>`;
    typing += `<path d="${textGlyphs(sp.line, lx, ty, PS).map((g) => g.d).join('')}" fill="${C.glaze}" clip-path="url(#ln${i})"/>`;

    stops.forEach((w, k) => {
      curVals.push(lx + w + 2);
      curKeys.push(Number(kt(sp.start + k * perChar)));
    });
    curVals.push(lx + 2);
    curKeys.push(Number(kt(sp.end)));
  });
  if (curKeys[0] !== 0) {
    curVals.unshift(lx + 2);
    curKeys.unshift(0);
  }
  // dedupe identical keyTimes (keep the last value at that time)
  const cv = [];
  const ck = [];
  curKeys.forEach((k, i) => {
    if (ck.length && ck[ck.length - 1] === k) cv[cv.length - 1] = curVals[i];
    else {
      ck.push(k);
      cv.push(curVals[i]);
    }
  });
  const cursor = `<rect x="${lx + 2}" y="${ty}" width="${PS * 3}" height="${PS * 7}" fill="${C.ochre}" class="blink"><animate attributeName="x" dur="${r2(total)}s" begin="1.7s" repeatCount="indefinite" calcMode="discrete" values="${cv.join(';')}" keyTimes="${ck.map((k) => k.toFixed(4)).join(';')}"/></rect>`;

  const panel = `
  <g class="fade" style="animation-delay:1.4s">
    <rect x="${px + 6}" y="${py + 6}" width="${pw}" height="${ph}" fill="${C.night}"/>
    <rect x="${px}" y="${py}" width="${pw}" height="${ph}" fill="${C.deep}" stroke="${C.cobaltMid}" stroke-width="3"/>
    <path d="${textGlyphs('>', tx, ty, PS)[0].d}" fill="${C.ochre}"/>
    ${typing}
    ${cursor}
  </g>`;

  // hud
  const hud = `
  <rect x="0" y="0" width="${W}" height="48" fill="${C.night}" opacity=".82"/>
  <rect x="0" y="${H - 48}" width="${W}" height="48" fill="${C.night}" opacity=".82"/>
  ${textAt('1UP', { x: 30, y: 17, s: 2, fill: C.red })}
  ${textAt('RIPPER', { x: 30 + textWidth('1UP ', 2) + 6, y: 17, s: 2, fill: C.glaze })}
  ${textAt('HI-SCORE', { x: W - 30 - textWidth(' 7000', 2) - 6, y: 17, s: 2, fill: C.ochre, anchor: 'end' })}
  ${textAt('7000', { x: W - 30, y: 17, s: 2, fill: C.glaze, anchor: 'end' })}
  ${textAt("RIPPER'S GAMES · PORTUGAL", { x: 30, y: H - 31, s: 2, fill: C.sky })}
  <g class="blinkSlow">${textAt('PRESS START', { x: W - 30, y: H - 31, s: 2, fill: C.ochre, anchor: 'end' })}</g>`;

  const style = `
  .pop{transform-box:fill-box;transform-origin:center;animation:pop .55s cubic-bezier(.3,1.6,.5,1) both}
  @keyframes pop{0%{transform:scale(0) rotate(90deg);opacity:0}100%{transform:scale(1) rotate(0);opacity:1}}
  .hot{opacity:0;animation:hot 7s ease-in-out infinite}
  @keyframes hot{0%,70%,100%{opacity:0}82%{opacity:.9}}
  .drop{animation:drop .7s cubic-bezier(.25,1.5,.45,1) both}
  @keyframes drop{0%{transform:translateY(-260px)}100%{transform:translateY(0)}}
  .fade{animation:fade .5s ease-out both}
  @keyframes fade{0%{opacity:0;transform:translateY(10px)}100%{opacity:1;transform:none}}
  .blink{animation:blink 1s steps(1) infinite}
  @keyframes blink{50%{opacity:0}}
  .blinkSlow{animation:blink 1.6s steps(1) infinite}
  .sweep{animation:sweep 9s ease-in-out 2.5s infinite}
  @keyframes sweep{0%{transform:translateX(-500px) skewX(-25deg)}35%,100%{transform:translateX(1400px) skewX(-25deg)}}
  @media (prefers-reduced-motion:reduce){*{animation:none!important}}`;

  const body = `
  <g clip-path="url(#card)">
    <rect width="${W}" height="${H}" fill="${C.deep}"/>
    <g>${tiles}</g>
    <g>${hot}</g>
    <rect width="${W}" height="${H}" fill="url(#vig)"/>
    <rect class="sweep" x="0" y="0" width="260" height="${H}" fill="url(#glint)"/>
    ${hud}
    ${name}
    ${panel}
  </g>
  <rect x="1.5" y="1.5" width="${W - 3}" height="${H - 3}" rx="17" fill="none" stroke="${C.cobalt}" stroke-width="3"/>`;

  return svg(W, H, body, {
    title: "ripper: game developer from portugal. making games since age 9, 7,000 players on one roblox game, self-taught, builds tools for people who make things.",
    defs,
    style,
  });
}
