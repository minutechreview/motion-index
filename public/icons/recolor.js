// Shared by the hero stage and the viewer page: swap the pack's orange accent (#FF6200) in a
// base-colour texture for another colour. Cream and charcoal pixels are left alone, and each
// orange pixel keeps its own shading, so highlights and shadows survive.
import * as THREE from 'three'

export const PRESETS = [
  ['orange', 'ff6200'], ['blue', '3b82f6'], ['purple', '8b5cf6'], ['green', '22c55e'],
  ['pink', 'ec4899'], ['red', 'ef4444'], ['teal', '14b8a6'], ['yellow', 'facc15']
]

export function recolorTexture(tex, hex) {
  const img = tex.image
  const canvas = document.createElement('canvas')
  canvas.width = img.width
  canvas.height = img.height
  const g = canvas.getContext('2d')
  g.drawImage(img, 0, 0)
  const d = g.getImageData(0, 0, canvas.width, canvas.height)
  const t = [0, 2, 4].map(i => parseInt(hex.slice(i, i + 2), 16) / 255)
  const grey = (t[0] + t[1] + t[2]) / 3
  for (let i = 0; i < d.data.length; i += 4) {
    const r = d.data[i] / 255, gg = d.data[i + 1] / 255, b = d.data[i + 2] / 255
    const mx = Math.max(r, gg, b), mn = Math.min(r, gg, b), dd = mx - mn
    if (dd < 1e-6) continue
    let h = mx === r ? ((gg - b) / dd) % 6 : mx === gg ? (b - r) / dd + 2 : (r - gg) / dd + 4
    h = (h * 60 + 360) % 360
    const s = dd / mx
    const w = Math.max(0, 1 - Math.abs(h - 24) / 22) * Math.min(1, Math.max(0, (s - 0.25) / 0.25))
    if (!w) continue
    for (let c = 0; c < 3; c++) {
      const tinted = Math.min(1, (grey + (t[c] - grey) * s) * mx)
      d.data[i + c] = Math.round(((d.data[i + c] / 255) * (1 - w) + tinted * w) * 255)
    }
  }
  g.putImageData(d, 0, 0)
  const out = new THREE.CanvasTexture(canvas)
  out.flipY = tex.flipY
  out.colorSpace = tex.colorSpace
  out.wrapS = tex.wrapS
  out.wrapT = tex.wrapT
  return out
}

// Recolour every textured material under obj, keeping the originals so a later call can start fresh.
export function tint(obj, hex) {
  obj.traverse(m => {
    if (!m.material || !m.material.map) return
    m.userData.originalMap ??= m.material.map
    m.material.map = hex === 'ff6200' ? m.userData.originalMap : recolorTexture(m.userData.originalMap, hex)
    m.material.needsUpdate = true
  })
}
