// Preview scenes for styles found by the daily motion scout and approved by Rayan (9 Nov 2026).
// Each export is static markup; the motion lives in /scenes-scout.css. Base styles show the finished frame,
// so reduced-motion users still see a complete scene. All artwork is original; the creators are credited in the catalog.

// RPG dialogue box (from andyhuo520's vibe-knowledge "RPG 对话框" style): a pixel portrait and a typed message.
const rpgLine = 'A wild DEADLINE appeared!';
const rpgDialog = `<div class="rg-sky"></div><div class="rg-hills"></div><div class="rg-ground"></div>
<div class="rg-hero"><i></i></div>
<div class="rg-box"><div class="rg-face"><i></i></div><div class="rg-text"><small>NARRATOR</small><p>${[...rpgLine]
  .map((ch, k) => `<span style="--k:${k}">${ch === ' ' ? '&nbsp;' : ch}</span>`).join('')}</p></div><b class="rg-next">▼</b></div>`;

// Golden hour to night (from Moh4696's open-3d-skills three.js pavilion scene): one place, relit from sunset to night.
const columns = [0, 1, 2, 3, 4].map(k => `<i style="--k:${k}"></i>`).join('');
const lamps = [0, 1, 2, 3].map(k => `<div class="dn-lamp" style="--k:${k}"><i></i></div>`).join('');
const stars = Array.from({ length: 14 }, (_, k) => `<i style="--x:${(k * 37) % 100}%;--y:${(k * 23) % 42}%;--k:${k}"></i>`).join('');
const dayNight = `<div class="dn-sky"></div><div class="dn-stars">${stars}</div><div class="dn-sun"></div><div class="dn-lawn"></div>
<div class="dn-path"></div>${lamps}<div class="dn-shadow"></div>
<div class="dn-pavilion"><div class="dn-dome"></div><div class="dn-cols">${columns}</div><div class="dn-glow"></div><div class="dn-base"></div></div>
<div class="dn-tag"><b class="dn-time"></b><small>SAME SCENE · RELIT</small></div>`;

// Flat drawing to 3D (from Samnang Aing's flat-to-3d): a floor plan tilts up and its walls stand into a house.
const walls = [['n', 0, 0, 100, 0], ['s', 0, 100, 100, 100], ['w', 0, 0, 0, 100], ['e', 100, 0, 100, 100], ['i', 0, 55, 60, 55], ['j', 60, 55, 60, 100]]
  .map(([k, x1, y1, x2, y2]) => `<i class="ft-wall ft-${x1 === x2 ? 'v' : 'h'}" style="--x:${x1}%;--y:${y1}%;--l:${Math.abs(x2 - x1 + y2 - y1)}%"></i>`).join('');
const flatTo3d = `<div class="ft-grid"></div><div class="ft-stage"><div class="ft-plan"><div class="ft-floor"></div>${walls}
<i class="ft-door"></i><i class="ft-room" style="--x:8%;--y:10%">LIVING</i><i class="ft-room" style="--x:8%;--y:66%">BED</i><i class="ft-room" style="--x:66%;--y:66%">BATH</i></div></div>
<div class="ft-tag"><b>PLAN</b><b>→ 3D</b><small>SCROLL TO BUILD</small></div>`;

// Threads of light type (from kubai's pro-threads): a word woven from fine glowing threads with light running along them.
const threadType = `<div class="tt-haze"></div><div class="tt-word" data-w="GLOW">GLOW</div><div class="tt-word tt-sweep" data-w="GLOW">GLOW</div>
<small class="tt-cap">WOVEN FROM LIGHT</small>`;

// Living ASCII field (from yusen-dev's living-ascii): a still landscape rebuilt as stroke glyphs that sway in the wind.
const asciiCells = Array.from({ length: 14 * 22 }, (_, k) => {
  const x = k % 22, y = Math.floor(k / 22);
  const sky = y < 5;
  return `<i style="--x:${x};--y:${y};--h:${sky ? 205 - y * 4 : 70 + (y * 7 + x * 3) % 40}">${sky ? (x + y) % 5 ? '·' : '-' : '|'}</i>`;
}).join('');
const livingAscii = `<div class="la-grid">${asciiCells}</div><small class="la-cap">STILL IMAGE → LIVING LOOP</small>`;

// Animated app splash (from seyedmostafahasani's react-native-splash-motion): launch colour, the logo mark draws
// itself and pulses while the app loads, then it bursts outward to reveal the app.
const splashRows = [0, 1, 2].map(k => `<div class="sp-row" style="--k:${k}"><i></i><b></b></div>`).join('');
const splashMotion = `<div class="sp-phone"><div class="sp-app"><div class="sp-bar"><i></i><b></b></div>${splashRows}</div>
<div class="sp-splash"><svg class="sp-mark" viewBox="0 0 100 100"><circle class="sp-ring" cx="50" cy="50" r="34"/>
<path class="sp-wave" d="M30 54 Q40 36 50 50 T70 46"/><circle class="sp-dot" cx="70" cy="46" r="5"/></svg><i class="sp-load"></i></div></div>
<small class="sp-cap">LAUNCH → LOGO → APP</small>`;

export const scoutShapes = {
  'rpg-dialog': rpgDialog,
  'day-night': dayNight,
  'flat-to-3d': flatTo3d,
  'thread-type': threadType,
  'living-ascii': livingAscii,
  'splash-motion': splashMotion,
};
