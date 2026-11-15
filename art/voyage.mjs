// the voyage log: a year of contributions as a sea of azulejo tiles, with a caravel crossing it.
// run: GITHUB_TOKEN=... node art/voyage.mjs juztripper   (no token = demo data, for local previews)
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { C, CARAVEL, svg, bitmap, textAt, textWidth, rng, r2 } from './lib.mjs';

const W = 880;
const H = 344;
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const LEVELS = { NONE: 0, FIRST_QUARTILE: 1, SECOND_QUARTILE: 2, THIRD_QUARTILE: 3, FOURTH_QUARTILE: 4 };
const TILE = ['#0f1c4a', '#1d3a8f', '#2c5bc8', '#6b98f2', C.ochre];
const SHINE = ['#16255c', '#2a4ba8', '#4573de', '#a9c3f8', '#ffd583'];

async function fetchWeeks(login, token) {
  const query = `query($login:String!){user(login:$login){contributionsCollection{contributionCalendar{totalContributions weeks{contributionDays{date contributionCount contributionLevel weekday}}}}}}`;
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: { Authorization: `bearer ${token}`, 'Content-Type': 'application/json', 'User-Agent': 'voyage-log' },
    body: JSON.stringify({ query, variables: { login } }),
  });
  if (!res.ok) throw new Error(`github graphql ${res.status}: ${await res.text()}`);
  const json = await res.json();
  if (json.errors) throw new Error(JSON.stringify(json.errors));
  const cal = json.data.user.contributionsCollection.contributionCalendar;
  return cal.weeks.map((w) =>
    w.contributionDays.map((d) => ({ date: d.date, count: d.contributionCount, level: LEVELS[d.contributionLevel] ?? 0, weekday: d.weekday })),
  );
}

function demoWeeks() {
  const rand = rng(1234);
  const end = new Date('2026-11-15T00:00:00Z');
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - 52 * 7 - end.getUTCDay());
  const weeks = [];
  for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    if (d.getUTCDay() === 0) weeks.push([]);
    const burst = Math.sin(d.getTime() / 6e8) > 0.2;
    const count = rand() < (burst ? 0.85 : 0.35) ? Math.floor(rand() * (burst ? 18 : 6)) : 0;
    weeks[weeks.length - 1].push({ date: d.toISOString().slice(0, 10), count, weekday: d.getUTCDay() });
  }
  for (const w of weeks) for (const d of w) d.level = d.count === 0 ? 0 : d.count < 3 ? 1 : d.count < 7 ? 2 : d.count < 12 ? 3 : 4;
  return weeks;
}

function stats(weeks) {
  const days = weeks.flat();
  const total = days.reduce((a, d) => a + d.count, 0);
  let longest = 0;
  let run = 0;
  for (const d of days) {
    run = d.count > 0 ? run + 1 : 0;
    longest = Math.max(longest, run);
  }
  // current streak: today may still be empty, so don't let it break the streak
  let current = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].count > 0) current++;
    else if (i === days.length - 1) continue;
    else break;
  }
  const best = days.reduce((a, d) => (d.count > a.count ? d : a), days[0]);
  return { total, longest, current, best };
}

const fmt = (n) => n.toLocaleString('en-US');

export function voyage(weeks) {
  weeks = weeks.slice(-53);
  const st = stats(weeks);
  const rand = rng(99);
  const step = 16;
  const tile = 14;
  const gx = Math.round((W - weeks.length * step + 2) / 2);
  const gy = 168;
  const surface = 152;

  // stars
  let stars = '';
  for (let i = 0; i < 46; i++) {
    const x = Math.floor(rand() * (W - 40)) + 20;
    const y = Math.floor(rand() * (surface - 30)) + 10;
    const s = rand() < 0.2 ? 3 : 2;
    const tw = rand() < 0.5;
    stars += `<rect x="${x}" y="${y}" width="${s}" height="${s}" fill="${rand() < 0.15 ? C.ochre : C.ice}" opacity="${r2(0.35 + rand() * 0.5)}" ${tw ? `class="tw" style="animation-delay:${r2(rand() * 4)}s"` : ''}/>`;
  }

  // tile sea, one column per week, columns swell in sequence
  let sea = '';
  weeks.forEach((week, c) => {
    let col = '';
    for (const d of week) {
      const x = gx + c * step;
      const y = gy + d.weekday * step;
      col += `<rect x="${x}" y="${y}" width="${tile}" height="${tile}" fill="${TILE[d.level]}"/>`;
      if (d.level > 0) col += `<rect x="${x + 2}" y="${y + 2}" width="4" height="2" fill="${SHINE[d.level]}"/><rect x="${x + 2}" y="${y + 4}" width="2" height="2" fill="${SHINE[d.level]}"/>`;
      if (d.level === 4) col += `<rect x="${x + 5}" y="${y + 5}" width="4" height="4" fill="#fff4d6" class="tw" style="animation-delay:${r2(rand() * 3)}s"/>`;
    }
    sea += `<g class="swell" style="animation-delay:${r2(-c * 0.09)}s">${col}</g>`;
  });

  // month labels on the first week that starts a month
  let months = '';
  let lastM = -1;
  let lastX = -99;
  weeks.forEach((week, c) => {
    const first = week.find((d) => d.date.slice(8) <= '07') ?? week[0];
    const m = Number(first.date.slice(5, 7)) - 1;
    const x = gx + c * step;
    if (m !== lastM && Number(first.date.slice(8)) <= 7 && x - lastX > 40 && c < weeks.length - 1) {
      months += textAt(MONTHS[m], { x, y: gy + 7 * step + 6, s: 2, fill: C.sky, extra: 'opacity=".8"' });
      lastM = m;
      lastX = x;
    }
  });

  // waves: a strip of pixel crests that scrolls forever
  const crest = ['..wwww..........', '.w....w.........', 'w......ww......w', '.........wwwwww.'];
  const crestW = crest[0].length * 2;
  let waveRow = '';
  for (let x = -crestW; x < W + crestW * 2; x += crestW) waveRow += bitmap(crest, x, 0, 2, { w: C.sky });
  const waves = `
    <rect x="0" y="${surface + 2}" width="${W}" height="${H - surface}" fill="#0a1436"/>
    <g opacity=".35"><g class="wave2" transform="translate(0 ${surface + 4})">${waveRow}</g></g>
    <g class="wave" transform="translate(0 ${surface - 4})">${waveRow}</g>`;

  // caravel + wake
  const shipColors = { w: C.glaze, r: C.red, m: '#7a4b22', f: C.red, b: '#8a5a2b', d: '#5a3816', y: C.ochre };
  const S = 3;
  const sw = CARAVEL[0].length * S;
  const sh = CARAVEL.length * S;
  const ship = `
  <g class="sail">
    <g transform="translate(0 ${surface - sh + 6})">
      <g class="bob">
        <path d="M-6 ${sh - 3}h-14M-10 ${sh + 1}h-22M-4 ${sh + 4}h-12" stroke="${C.ice}" stroke-width="2" opacity=".6" class="wake"/>
        ${bitmap(CARAVEL, 0, 0, S, shipColors)}
      </g>
    </g>
  </g>`;

  // lighthouse on a rock at the right edge: "today"
  const LH = [
    '...kk...',
    '..kLLk..',
    '..kLLk..',
    '..wwww..',
    '...rr...',
    '...ww...',
    '...rr...',
    '...ww...',
    '...ww...',
    '..rrrr..',
    '..rrrr..',
    '..wwww..',
    '.kkkkkk.',
    'kkkkkkkk',
  ];
  const lhx = W - 58;
  const lhs = 4;
  const lhy = surface - LH.length * lhs + 4;
  const lighthouse = `
  <g>
    <path d="M${lhx + 16} ${lhy + 10}L${lhx - 190} ${lhy - 20}L${lhx - 190} ${lhy + 40}Z" fill="url(#beam)" class="beam" style="transform-origin:${lhx + 16}px ${lhy + 10}px"/>
    ${bitmap(LH, lhx, lhy, lhs, { r: C.red, w: C.glaze, L: '#ffe9a8', k: '#1c2547' })}
  </g>`;

  // header text
  const statItems = [
    [fmt(st.total), 'CONTRIBUTIONS'],
    [`${st.longest}D`, 'LONGEST STREAK'],
    [`${st.current}D`, 'CURRENT STREAK'],
  ];
  let sx = W - 30;
  let statsSvg = '';
  for (const [v, label] of statItems.reverse()) {
    const lw = Math.max(textWidth(label, 2), textWidth(v, 3));
    statsSvg += textAt(v, { x: sx, y: 26, s: 3, fill: C.ochre, anchor: 'end' });
    statsSvg += textAt(label, { x: sx, y: 56, s: 2, fill: C.sky, anchor: 'end' });
    sx -= lw + 30;
  }

  const legendX = W - 30 - textWidth('MORE', 2);
  let legend = textAt('MORE', { x: W - 30, y: H - 28, s: 2, fill: C.sky, anchor: 'end' });
  for (let l = 4; l >= 0; l--) legend += `<rect x="${legendX - 10 - (5 - l) * 16 + 2}" y="${H - 30}" width="14" height="14" fill="${TILE[l]}"/>`;
  legend += textAt('LESS', { x: legendX - 10 - 5 * 16 - 8, y: H - 28, s: 2, fill: C.sky, anchor: 'end' });

  const defs = `
  <clipPath id="card"><rect width="${W}" height="${H}" rx="18"/></clipPath>
  <linearGradient id="skyg" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${C.night}"/><stop offset="1" stop-color="#132056"/>
  </linearGradient>
  <linearGradient id="beam" x1="1" x2="0">
    <stop offset="0" stop-color="#ffe9a8" stop-opacity=".55"/><stop offset="1" stop-color="#ffe9a8" stop-opacity="0"/>
  </linearGradient>`;

  const style = `
  .tw{animation:tw 3.2s ease-in-out infinite}
  @keyframes tw{0%,100%{opacity:.25}50%{opacity:1}}
  .swell{animation:swell 4.8s ease-in-out infinite}
  @keyframes swell{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}
  .wave{animation:wave 3s linear infinite}
  .wave2{animation:wave2 5s linear infinite}
  @keyframes wave{from{transform:translate(0,${surface - 4}px)}to{transform:translate(-${crestW}px,${surface - 4}px)}}
  @keyframes wave2{from{transform:translate(-${crestW}px,${surface + 4}px)}to{transform:translate(0,${surface + 4}px)}}
  .sail{animation:sail 26s linear infinite}
  @keyframes sail{from{transform:translateX(-${sw + 40}px)}to{transform:translateX(${W - 80}px)}}
  .bob{transform-box:fill-box;transform-origin:50% 100%;animation:bob 2.6s ease-in-out infinite}
  @keyframes bob{0%,100%{transform:translateY(0) rotate(-2.5deg)}50%{transform:translateY(3px) rotate(2.5deg)}}
  .wake{animation:tw 1.3s ease-in-out infinite}
  .beam{animation:beam 4s ease-in-out infinite}
  @keyframes beam{0%,100%{transform:scaleX(1);opacity:.9}50%{transform:scaleX(.15);opacity:.2}}
  @media (prefers-reduced-motion:reduce){*{animation:none!important}}`;

  const body = `
  <g clip-path="url(#card)">
    <rect width="${W}" height="${H}" fill="url(#skyg)"/>
    ${stars}
    ${bitmap(['..mmm.', '.mm...', 'mm....', 'mm....', 'mm....', '.mm...', '..mmm.'], 330, 92, 4, { m: '#f6e7b8' })}
    ${textAt('VOYAGE LOG', { x: 30, y: 26, s: 3, fill: C.glaze })}
    ${textAt('ONE TILE A DAY', { x: 30, y: 56, s: 2, fill: C.sky })}
    ${statsSvg}
    ${lighthouse}
    ${waves}
    ${ship}
    ${sea}
    ${months}
    ${textAt('★ GOLD TILES ARE THE BIG DAYS', { x: 30, y: H - 28, s: 2, fill: C.ochre })}
    ${legend}
  </g>
  <rect x="1.5" y="1.5" width="${W - 3}" height="${H - 3}" rx="17" fill="none" stroke="${C.cobalt}" stroke-width="3"/>`;

  return svg(W, H, body, {
    title: `voyage log: ${fmt(st.total)} contributions in the last year, longest streak ${st.longest} days, current streak ${st.current} days.`,
    defs,
    style,
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const login = process.argv[2] ?? 'juztripper';
  const token = process.env.VOYAGE_TOKEN || process.env.GITHUB_TOKEN;
  const weeks = token ? await fetchWeeks(login, token) : demoWeeks();
  if (!token) console.warn('no token, using demo data');
  const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'voyage.svg');
  writeFileSync(out, voyage(weeks));
  console.log('wrote', out);
}
