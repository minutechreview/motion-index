// Preview scenes for the styles referenced from Gian Angioletti's (@ultra.skills) reel.
// Each export is static markup; the motion lives in /scenes-ultra.css.
// Base styles show the resolved state, so reduced-motion users still see a finished frame.

const seeded = seed => () => {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
};
const round = value => Math.round(value * 10) / 10;
const points = list => list.map(([x, y]) => `${round(x)},${round(y)}`).join(' ');

function gitCity() {
  const size = 7, dx = 11, dy = 6.35, ox = 110, oy = 44, shrink = 0.74;
  const random = seeded(7);
  const bars = [];
  for (let i = 0; i < size; i++) for (let j = 0; j < size; j++) {
    const distance = Math.hypot(i - 3, j - 3);
    const height = 4 + 46 * Math.exp(-(distance * distance) / 7) * (0.35 + random() * 0.65);
    bars.push({ i, j, height });
  }
  bars.sort((a, b) => a.i + a.j - (b.i + b.j));
  const shapes = bars.map(({ i, j, height }, index) => {
    const x = ox + (i - j) * dx, y = oy + (i + j) * dy;
    const w = dx * shrink, h = dy * shrink;
    const north = [x, y - h], east = [x + w, y], south = [x, y + h], west = [x - w, y];
    const up = ([px, py]) => [px, py - height];
    const delay = round(((i + j) * 0.07) + (index % 3) * 0.04);
    return `<g class="gc-bar" style="--d:${delay}s"><polygon class="gc-l" points="${points([west, south, up(south), up(west)])}"/><polygon class="gc-r" points="${points([south, east, up(east), up(south)])}"/><polygon class="gc-t" points="${points([up(north), up(east), up(south), up(west)])}"/></g>`;
  }).join('');
  const edge = size * 1;
  const ground = points([[ox, oy - dy], [ox + edge * dx, oy - dy + edge * dy], [ox, oy - dy + 2 * edge * dy], [ox - edge * dx, oy - dy + edge * dy]]);
  return `<svg class="gc-svg" viewBox="0 0 220 150" role="presentation"><polygon class="gc-ground" points="${ground}"/>${shapes}</svg><span class="micro top-left gc-label">COMMITS PER DAY · DEMO REPO</span><span class="micro bottom-right gc-total">1,284 THIS YEAR</span>`;
}

function agentSwarm() {
  const roles = ['research', 'code', 'design', 'copy'];
  const nodes = [], lines = [];
  for (let row = 0; row < 4; row++) for (let col = 0; col < 5; col++) {
    const index = row * 5 + col;
    const x = 14 + col * 18, y = 18 + row * 21;
    const delay = round(((index * 7) % 20) * 0.045);
    nodes.push(`<i style="--x:${x}%;--y:${y}%;--d:${delay}s"><b></b><span>${roles[(index * 3 + row) % 4]}</span></i>`);
    lines.push(`<path pathLength="100" style="--d:${delay}s" d="M50 50 Q${round((50 + x) / 2 + (row - 1.5) * 6)} ${round((50 + y) / 2 - (col - 2) * 4)} ${x} ${y}"/>`);
  }
  return `<svg class="sw-lines" viewBox="0 0 100 100" preserveAspectRatio="none" role="presentation">${lines.join('')}</svg><div class="sw-nodes">${nodes.join('')}</div><div class="sw-window"><div class="sw-bar"><i></i><i></i><i></i></div><div class="sw-shot"><em></em><em></em><em></em></div><b>Launch page</b><small>Built by 20 agents ✓</small></div><span class="micro top-left sw-label">20 AGENTS · ONE TASK</span>`;
}

function terminalBloom() {
  const random = seeded(42);
  const word = text => [...text].map(char => {
    const x = round((random() - 0.5) * 160), y = round((random() - 0.5) * 120), r = Math.round((random() - 0.5) * 540);
    const delay = round(random() * 0.6);
    return `<span style="--x:${x}cqw;--y:${y}cqh;--r:${r}deg;--d:${delay}s">${char === ' ' ? '&nbsp;' : char}</span>`;
  }).join('');
  return `<div class="tb-page"><div class="tb-nav"><i></i><b>Halo</b><em></em></div><div class="tb-hero"><small>Demo page · fictional product</small><h4>${word('Ideas that')}<br>${word('ship themselves.')}</h4></div><div class="tb-sub">Start a thought. Halo writes the rest.</div><div class="tb-actions"><span>Start writing</span><span>See it work</span></div><div class="tb-cards"><i></i><i></i><i></i></div></div><div class="tb-bloom"></div>`;
}

const hologram = `<div class="holo-cone"></div><div class="holo-pad"></div><svg class="holo-svg" viewBox="0 0 200 150" role="presentation"><g class="holo-drone"><path class="holo-line" pathLength="100" d="M78 52 L122 52 L128 62 L72 62 Z M86 62 L90 72 L110 72 L114 62 M72 56 L44 48 M128 56 L156 48 M80 52 L56 40 M120 52 L144 40"/><ellipse class="holo-rotor" cx="44" cy="46" rx="15" ry="2.6"/><ellipse class="holo-rotor" cx="156" cy="46" rx="15" ry="2.6"/><ellipse class="holo-rotor" cx="56" cy="38" rx="13" ry="2.2"/><ellipse class="holo-rotor" cx="144" cy="38" rx="13" ry="2.2"/><path class="holo-line" pathLength="100" d="M92 72 L88 82 M108 72 L112 82 M100 72 L100 80 M86 80 L100 74 L114 80 L100 86 Z M86 80 L86 96 L100 102 L114 96 L114 80 M100 86 L100 102"/></g></svg><div class="holo-scan"></div><span class="holo-tag t1">BATTERY 82% · DEMO</span><span class="holo-tag t2">PARCEL 2.4 KG</span><span class="micro top-left holo-title">DRONE 03 · BAY 2</span>`;

const typeSlam = `<div class="ts-ghost">LOUDER</div><div class="ts-say">SAY<br>IT</div><div class="ts-wipe"></div><div class="ts-loud">LOUDER</div>`;

const inkDoodle = `<svg class="dd-svg" viewBox="0 0 220 160" role="presentation"><defs><filter id="dd-wobble"><feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="2" seed="3"/><feDisplacementMap in="SourceGraphic" scale="2.4"/></filter></defs><g filter="url(#dd-wobble)"><path class="dd-cloud" d="M14 26 q4 -10 14 -6 q6 -8 14 0 q8 0 6 8 q-2 6 -12 5 l-20 0 q-8 -1 -2 -7 Z"/><path class="dd-cloud" d="M170 18 q4 -9 13 -5 q6 -7 13 0 q7 1 5 8 q-3 5 -11 4 l-18 0 q-7 -1 -2 -7 Z"/><path class="dd-ink" d="M84 0 L84 14 M136 0 L136 14"/><rect class="dd-sign" x="66" y="14" width="88" height="24" rx="2"/><text class="dd-sign-text" x="110" y="30">FIRST DRAFT</text><path class="dd-under" d="M78 33 q16 3 32 0 t32 0"/><path class="dd-ground dd-ink" d="M0 118 q20 -3 40 1 t40 -1 t40 1 t40 -1 t60 1"/><path class="dd-ink dd-tuft" d="M24 132 l2 -4 l2 4 M70 140 l2 -4 l2 4 M180 134 l2 -4 l2 4 M140 146 l2 -4 l2 4"/><g class="dd-writer"><circle class="dd-ink dd-head" cx="98" cy="74" r="7"/><path class="dd-ink" d="M98 81 L98 100 M98 100 L92 117 M98 100 L106 117"/><path class="dd-ink dd-arms-down" d="M98 86 L112 92 M98 86 L110 96"/><path class="dd-ink dd-arms-up" d="M98 86 L90 66 M98 86 L108 64"/></g><rect class="dd-desk" x="108" y="96" width="34" height="22"/><rect class="dd-type" x="112" y="88" width="26" height="9" rx="2"/><path class="dd-ink dd-sheet" d="M118 88 L118 76 L132 76 L132 88 M121 80 L129 80 M121 83 L127 83"/><g class="dd-card"><rect x="150" y="98" width="46" height="22" rx="2"/><text x="173" y="113">recieve</text><path class="dd-strike" d="M154 110 q18 -3 38 1"/></g></g><g class="dd-balls"><circle style="--tx:-46px;--d:0s" cx="120" cy="80" r="3.6"/><circle style="--tx:-58px;--d:.5s" cx="120" cy="80" r="3.2"/><circle style="--tx:-38px;--d:1s" cx="120" cy="80" r="3.8"/><circle style="--tx:-66px;--d:1.5s" cx="120" cy="80" r="3"/></g></svg>`;

const deepTime = `<div class="dt-stars"></div><div class="dt-disk dt-back"><i></i></div><div class="dt-lens"></div><div class="dt-hole"></div><div class="dt-disk dt-front"><i></i></div><div class="dt-count"><b class="dt-num"></b><small>MILLION YEARS · DEMO</small></div>`;

const contourLayers = [0, 1, 2, 3, 4, 5].map(k => `<div class="ct-layer" style="--k:${k}"><svg viewBox="0 0 100 100" role="presentation"><path d="M50 ${8 + k * 6} C${74 - k * 3} ${10 + k * 6} ${92 - k * 6} ${30 + k * 3} ${90 - k * 6} ${52} C${88 - k * 6} ${76 - k * 3} ${66 - k * 3} ${92 - k * 6} ${46} ${90 - k * 6} C${24 + k * 3} ${88 - k * 6} ${10 + k * 6} ${70 - k * 3} ${12 + k * 6} ${48} C${14 + k * 6} ${24 + k * 3} ${30 + k * 3} ${8 + k * 6} 50 ${8 + k * 6} Z"/></svg>${k === 5 ? '<i class="ct-flag"></i>' : ''}</div>`).join('');
const contour = `<div class="ct-stage"><div class="ct-stack">${contourLayers}</div></div><div class="ct-ruler"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div><div class="ct-gauge"><b class="ct-num"></b><small>FOLLOWERS · DEMO</small></div>`;

const neon = `<div class="nn-window"><div class="nn-sky"></div><div class="nn-city"></div><div class="nn-lights"></div><div class="nn-frame"></div></div><svg class="nn-figure" viewBox="0 0 100 80" role="presentation"><path d="M50 4 C36 4 30 16 30 28 C30 36 32 40 34 44 C18 48 10 60 8 80 L92 80 C90 60 82 48 66 44 C68 40 70 36 70 28 C70 16 64 4 50 4 Z"/><circle class="nn-eye" cx="44" cy="28" r="1.6"/><circle class="nn-eye" cx="56" cy="28" r="1.6"/></svg><div class="nn-lamp"><i></i></div><div class="nn-clock"><span><b>2</b><b>0</b></span><span><b>3</b><b>0</b></span><em>:</em><span><b>5</b><b>0</b></span><span><b>9</b><b>0</b></span><small>DEADLINE</small></div>`;

const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const dayCards = days.map((day, index) => {
  const left = index % 2 === 0, level = Math.floor(index / 2);
  const x = left ? 34 : 154, y = 106 - level * 15;
  return `<g class="pv-card ${left ? 'pv-left' : 'pv-right'}" style="--d:${round(index * 0.32)}s;--fall:${level * 15 + 2}px"><rect x="${x}" y="${y}" width="30" height="14" rx="1.5"/><rect class="pv-cap" x="${x}" y="${y}" width="30" height="4"/><text x="${x + 15}" y="${y + 12}">${day}</text></g>`;
}).join('');
const povDoodle = `<svg class="pv-svg" viewBox="0 0 220 160" role="presentation"><defs><filter id="pv-wobble"><feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" seed="9"/><feDisplacementMap in="SourceGraphic" scale="2"/></filter></defs><g filter="url(#pv-wobble)"><text class="pv-title" x="110" y="26">Ship week, drawn badly</text><path class="pv-under" d="M120 31 q14 3 30 0"/><path class="pv-ink" d="M10 122 L210 122 M24 128 l-4 6 M60 128 l-4 6 M100 128 l-4 6 M140 128 l-4 6 M180 128 l-4 6"/><circle class="pv-ink pv-head" cx="110" cy="66" r="9"/><path class="pv-ink" d="M106 64 l0 1 M114 64 l0 1 M107 71 q3 1 6 0 M106 57 l2 -4 l2 3 l2 -4"/><path class="pv-ink" d="M78 92 L142 92 M84 92 L84 122 M136 92 L136 122"/><path class="pv-ink pv-laptop" d="M98 92 L102 78 L120 78 L122 92 Z"/><g class="pv-stacks">${dayCards}</g></g></svg>`;

export const ultraShapes = {
  'git-city': gitCity(),
  'agent-swarm': agentSwarm(),
  'type-slam': typeSlam,
  hologram: hologram,
  'ink-doodle': inkDoodle,
  'deep-time': deepTime,
  contour: contour,
  'neon-silhouette': neon,
  'pov-doodle': povDoodle,
  'terminal-bloom': terminalBloom(),
};
