// inventory hotbar (the stack) and the end-credits footer
import { C, TILES, svg, bitmap, textAt, textWidth, r2 } from './lib.mjs';

const W = 880;

function shape(fn, n = 14) {
  const rows = [];
  for (let y = 0; y < n; y++) {
    let row = '';
    for (let x = 0; x < n; x++) row += fn(x + 0.5, y + 0.5) ?? '.';
    rows.push(row);
  }
  return rows;
}

const square = () => shape((x, y) => ((x < 1 || x > 13) && (y < 1 || y > 13) ? null : 'a'));
const circle = () => shape((x, y) => (Math.hypot(x - 7, y - 7) < 6.8 ? 'a' : null));

const ITEMS = [
  { name: 'TYPESCRIPT', code: 'TS', bg: '#3178c6', fg: '#fff', base: square },
  { name: 'C#', code: 'C#', bg: '#7b3fb0', fg: '#fff', base: () => shape((x, y) => (Math.abs(x - 7) + Math.abs(y - 7) * 0.55 < 7.6 && Math.abs(y - 7) < 6.8 ? 'a' : null)) },
  { name: 'LUA', code: 'LUA', bg: '#1f2a94', fg: '#fff', base: () => shape((x, y) => (Math.hypot(x - 6.5, y - 7.5) < 6.2 ? 'a' : Math.hypot(x - 12.4, y - 1.6) < 1.6 ? 'a' : null)), ts: 1 },
  { name: 'PYTHON', code: 'PY', bg: '#3572a5', fg: '#fff', base: () => shape((x, y) => ((x < 1 || x > 13) && (y < 1 || y > 13) ? null : x + y < 14 ? 'a' : 'b')), bg2: '#e0b323' },
  { name: 'UNITY', code: '', bg: '#e8e8e8', fg: '#111', base: () => [
    '......aa......',
    '....aa..aa....',
    '..aa......aa..',
    'aa..........aa',
    'a.aa......aa.a',
    'a...aa..aa...a',
    'a.....aa.....a',
    'a......a.....a',
    'a......a.....a',
    'a......a.....a',
    'aa.....a....aa',
    '..aa...a..aa..',
    '....aa.a.aa...',
    '......aaa.....',
  ] },
  { name: 'ROBLOX STUDIO', code: '', bg: '#e8e8e8', fg: '#111', base: () => shape((x, y) => {
    const a = 0.26;
    const u = (x - 7) * Math.cos(a) + (y - 7) * Math.sin(a);
    const v = -(x - 7) * Math.sin(a) + (y - 7) * Math.cos(a);
    if (Math.abs(u) < 5.6 && Math.abs(v) < 5.6) return Math.abs(u) < 1.6 && Math.abs(v) < 1.6 ? null : 'a';
    return null;
  }) },
  { name: 'NEXT.JS', code: 'N', bg: '#111', fg: '#fff', base: circle },
  { name: 'MICRO:BIT', code: '', bg: '#1d1d1d', fg: '#fff', base: () => shape((x, y) => {
    if ((x < 1 || x > 13) && (y < 2 || y > 12)) return null;
    if (y < 1.5 || y > 12.5) return null;
    if (Math.hypot(x - 4.5, y - 7) < 1.7 || Math.hypot(x - 9.5, y - 7) < 1.7) return 'b';
    return 'a';
  }), bg2: '#ff5d6c' },
];

export function inventory() {
  const H = 186;
  const n = ITEMS.length;
  const slot = 84;
  const gap = 14;
  const sx = Math.round((W - (n * slot + (n - 1) * gap)) / 2);
  const sy = 76;
  const step = 1.8;
  const dur = n * step;

  let slots = '';
  ITEMS.forEach((it, i) => {
    const x = sx + i * (slot + gap);
    const s = 4;
    const ix = x + (slot - 14 * s) / 2;
    const iy = sy + (slot - 14 * s) / 2;
    let icon = `<path d="M${x + 6} ${sy + 6}h${slot - 12}v${slot - 12}h${-(slot - 12)}z" fill="${C.night}"/>`;
    icon += bitmap(it.base(), ix + 3, iy + 3, s, { a: '#000', b: '#000' }).replace(/fill="#000"/g, 'fill="#000" opacity=".45"');
    icon += bitmap(it.base(), ix, iy, s, { a: it.bg, b: it.bg2 ?? it.bg });
    if (it.code) {
      const ts = it.ts ?? 2;
      const tw = textWidth(it.code, ts * 2);
      icon += textAt(it.code, { x: ix + 28 - tw / 2 + 2 + ts * 2, y: iy + 28 - 7 * ts + 2 + ts * 2, s: ts * 2, fill: '#000', extra: 'opacity=".3"' });
      icon += textAt(it.code, { x: ix + 28 - tw / 2 + 2, y: iy + 28 - 7 * ts + 2, s: ts * 2, fill: it.fg });
    }
    slots += `
    <g class="pop" style="animation-delay:${r2(i * 0.07)}s">
      <rect x="${x}" y="${sy}" width="${slot}" height="${slot}" fill="${C.cobaltDeep}"/>
      <rect x="${x}" y="${sy}" width="${slot}" height="4" fill="${C.cobaltMid}"/>
      <rect x="${x}" y="${sy}" width="4" height="${slot}" fill="${C.cobaltMid}"/>
      <rect x="${x}" y="${sy + slot - 4}" width="${slot}" height="4" fill="${C.night}"/>
      <rect x="${x + slot - 4}" y="${sy}" width="4" height="${slot}" fill="${C.night}"/>
      <g class="bobi" style="animation-delay:${r2(-i * 0.3)}s">${icon}</g>
      ${textAt(String(i + 1), { x: x + 9, y: sy + 9, s: 2, fill: C.sky, extra: 'opacity=".7"' })}
    </g>`;
  });

  // the selector frame hops slot to slot; the item name follows
  const xs = ITEMS.map((_, i) => sx + i * (slot + gap) - 6);
  const keys = ITEMS.map((_, i) => r2(i / n)).join(';');
  const selector = `
  <g>
    <animateTransform attributeName="transform" type="translate" dur="${dur}s" begin="1s" repeatCount="indefinite" calcMode="discrete" values="${xs.map((x) => `${x} 0`).join(';')}" keyTimes="${keys}"/>
    <path d="M0 ${sy - 6}h${slot + 12}v${slot + 12}h${-(slot + 12)}z M6 ${sy}v${slot}h${slot}v${-slot}z" fill="${C.glaze}" fill-rule="evenodd"/>
    <path d="M-4 ${sy - 10}h14v6h-8v8h-6z M${slot + 16} ${sy - 10}h-14v6h8v8h6z M-4 ${sy + slot + 16}h14v-6h-8v-8h-6z M${slot + 16} ${sy + slot + 16}h-14v-6h8v-8h6z" fill="${C.ochre}" class="pulse"/>
  </g>`;
  let names = '';
  ITEMS.forEach((it, i) => {
    const vals = ITEMS.map((_, k) => (k === i ? 1 : 0)).join(';');
    names += `<g opacity="${i === 0 ? 1 : 0}"><animate attributeName="opacity" dur="${dur}s" begin="1s" repeatCount="indefinite" calcMode="discrete" values="${vals}" keyTimes="${keys}"/>${textAt(it.name, { x: W - 30, y: 26, s: 3, fill: C.ochre, anchor: 'end' })}</g>`;
  });

  const style = `
  .pop{animation:pop .5s cubic-bezier(.3,1.6,.5,1) both}
  @keyframes pop{from{transform:translateY(24px);opacity:0}to{transform:none;opacity:1}}
  .bobi{animation:bobi 2.4s ease-in-out infinite}
  @keyframes bobi{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}
  .pulse{animation:pulse .9s steps(1) infinite}
  @keyframes pulse{50%{opacity:.35}}
  @media (prefers-reduced-motion:reduce){*{animation:none!important}}`;

  const body = `
  <g clip-path="url(#card)">
    <rect width="${W}" height="${H}" fill="${C.deep}"/>
    ${textAt('INVENTORY', { x: 30, y: 26, s: 3, fill: C.glaze })}
    ${textAt('WHAT I BUILD WITH', { x: 30 + textWidth('INVENTORY ', 3) + 10, y: 32, s: 2, fill: C.sky })}
    ${names}
    ${slots}
    ${selector}
  </g>
  <rect x="1.5" y="1.5" width="${W - 3}" height="${H - 3}" rx="17" fill="none" stroke="${C.cobalt}" stroke-width="3"/>`;

  return svg(W, H, body, {
    title: 'inventory: typescript, c#, lua, python, unity, roblox studio, next.js, micro:bit',
    defs: `<clipPath id="card"><rect width="${W}" height="${H}" rx="18"/></clipPath>`,
    style,
  });
}

export function footer() {
  const H = 150;
  const ts = 4;
  let border = '';
  for (let x = 0; x < W; x += 32) {
    border += `<use href="#ft" x="${x}" y="0"/><use href="#ft" x="${x}" y="${H - 32}"/>`;
  }
  const title = 'THANKS FOR PLAYING';
  const sub = 'ATÉ JÁ · SEE YOU NEXT LEVEL';
  const style = `
  .rise{animation:rise .8s ease-out both}
  @keyframes rise{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
  .blink{animation:blink 1.4s steps(1) infinite}
  @keyframes blink{50%{opacity:0}}
  @media (prefers-reduced-motion:reduce){*{animation:none!important}}`;
  const body = `
  <g clip-path="url(#card)">
    <rect width="${W}" height="${H}" fill="${C.deep}"/>
    <g opacity=".5">${border}</g>
    <rect x="0" y="30" width="${W}" height="${H - 60}" fill="${C.deep}"/>
    <rect x="0" y="30" width="${W}" height="3" fill="${C.cobalt}"/>
    <rect x="0" y="${H - 33}" width="${W}" height="3" fill="${C.cobalt}"/>
    <g class="rise">${textAt(title, { x: W / 2 + 3, y: 50 + 3, s: ts, fill: C.cobaltDeep, anchor: 'middle' })}${textAt(title, { x: W / 2, y: 50, s: ts, fill: C.glaze, anchor: 'middle' })}</g>
    <g class="rise" style="animation-delay:.3s">${textAt(sub, { x: W / 2, y: 92, s: 2, fill: C.ochre, anchor: 'middle' })}</g>
    <g class="blink">${textAt('★', { x: W / 2 - textWidth(title, ts) / 2 - 36, y: 54, s: 3, fill: C.ochre })}${textAt('★', { x: W / 2 + textWidth(title, ts) / 2 + 22, y: 54, s: 3, fill: C.ochre })}</g>
  </g>
  <rect x="1.5" y="1.5" width="${W - 3}" height="${H - 3}" rx="17" fill="none" stroke="${C.cobalt}" stroke-width="3"/>`;
  return svg(W, H, body, {
    title: 'thanks for playing. até já, see you next level.',
    defs: `<clipPath id="card"><rect width="${W}" height="${H}" rx="18"/></clipPath><g id="ft">${bitmap(TILES.flower, 0, 0, 4, { 0: C.glazeDark, 1: C.cobaltDeep, 2: C.cobalt, 3: C.ochreDeep })}</g>`,
    style,
  });
}

// slim section header bar (own dark card so it reads on light and dark github themes)
export function header(title, sub) {
  const H = 64;
  const body = `
  <rect width="${W}" height="${H}" rx="14" fill="${C.deep}"/>
  <rect x="1.5" y="1.5" width="${W - 3}" height="${H - 3}" rx="13" fill="none" stroke="${C.cobalt}" stroke-width="3"/>
  <g class="blink">${textAt('>', { x: 26, y: 22, s: 3, fill: C.ochre })}</g>
  ${textAt(title, { x: 52, y: 22, s: 3, fill: C.glaze })}
  ${textAt(sub, { x: W - 28, y: 26, s: 2, fill: C.sky, anchor: 'end' })}`;
  return svg(W, H, body, {
    title: `${title.toLowerCase()}: ${sub.toLowerCase()}`,
    style: `.blink{animation:blink 1.1s steps(1) infinite}@keyframes blink{50%{opacity:0}}@media (prefers-reduced-motion:reduce){*{animation:none!important}}`,
  });
}
