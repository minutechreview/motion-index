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

export const scoutShapes = {
  'rpg-dialog': rpgDialog,
  'day-night': dayNight,
};
