// Icon Index page: grid of 3D icons (PNG, spinning loop on hover) and a detail dialog with the
// interactive viewer, colour picker, downloads and embed code. Data comes from icons.json.
const PRESETS = [
  ['orange', 'ff6200'], ['blue', '3b82f6'], ['purple', '8b5cf6'], ['green', '22c55e'],
  ['pink', 'ec4899'], ['red', 'ef4444'], ['teal', '14b8a6'], ['yellow', 'facc15']
]
const CATEGORIES = ['All', 'Tech', 'Money', 'Social', 'Work']
const $ = id => document.getElementById(id)
const state = { category: 'All', query: '', color: 'orange', open: null, detailHex: 'ff6200' }
let data

const presetName = hex => (PRESETS.find(([, h]) => h === hex) || [])[0] || ''
const folder = icon => `${data.asset_base}/icons/${icon.id}`
const pngUrl = (icon, color) => color === 'orange' ? `${folder(icon)}/icon.png` : `${folder(icon)}/colors/${color}/icon.png`
const viewerUrl = (icon, hex, dl) => `/icons/viewer.html#id=${icon.id}${hex !== 'ff6200' ? `&color=${hex}` : ''}${dl ? '&dl=1' : ''}`

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag)
  for (const [key, value] of Object.entries(attrs)) {
    if (key === 'text') node.textContent = value
    else if (key.startsWith('on')) node.addEventListener(key.slice(2), value)
    else node.setAttribute(key, value)
  }
  for (const child of [].concat(children)) node.append(child)
  return node
}

function swatches(container, active, onPick, withCustom) {
  container.replaceChildren(...PRESETS.map(([name, hex]) => el('button', {
    type: 'button', title: name, 'aria-label': `${name} accent`, 'aria-pressed': String(active === hex),
    style: `background:#${hex}`, onclick: () => onPick(hex)
  })))
  if (withCustom) {
    container.append(el('input', { type: 'color', value: `#${active}`, 'aria-label': 'Any colour', title: 'Any colour', oninput: e => onPick(e.target.value.slice(1)) }))
  }
}

function tile(icon) {
  const video = el('video', { muted: '', loop: '', playsinline: '', preload: 'none', src: `${folder(icon)}/turntable.mp4` })
  video.muted = true
  video.addEventListener('playing', () => video.classList.add('ready'))
  const node = el('button', { class: 'tile', type: 'button', 'aria-label': `Open ${icon.title}`, onclick: () => openIcon(icon) }, [
    el('div', { class: 'media' }, [el('img', { src: pngUrl(icon, state.color), alt: `3D ${icon.title.toLowerCase()} icon`, loading: 'lazy', width: 512, height: 512 }), state.color === 'orange' ? video : '']),
    el('div', {}, [el('b', { text: icon.title })]),
    el('small', { text: icon.category })
  ])
  node.addEventListener('mouseenter', () => { if (state.color === 'orange') video.play().catch(() => {}) })
  node.addEventListener('mouseleave', () => video.pause())
  return node
}

function render() {
  const words = state.query.toLowerCase().split(/\s+/).filter(Boolean)
  const list = data.icons.filter(icon => (state.category === 'All' || icon.category === state.category) &&
    words.every(w => `${icon.title} ${icon.category} ${icon.description} ${icon.tags.join(' ')}`.toLowerCase().includes(w)))
  $('grid').replaceChildren(...list.map(tile))
  $('empty').hidden = list.length > 0
  $('filters').replaceChildren(...CATEGORIES.map(name => el('button', {
    type: 'button', 'aria-pressed': String(state.category === name), text: name,
    onclick: () => { state.category = name; render() }
  })))
  swatches($('page-colors'), PRESETS.find(([n]) => n === state.color)[1], hex => { state.color = presetName(hex); render() }, false)
}

function renderDetail() {
  const icon = state.open
  const hex = state.detailHex
  const preset = presetName(hex)
  $('viewer').src = viewerUrl(icon, hex, true)
  swatches($('detail-colors'), hex, next => { state.detailHex = next.toLowerCase(); renderDetail() }, true)
  const links = preset === 'orange'
    ? [['GLB · web', 'model.glb'], ['GLB · full', 'model-full.glb'], ['PNG', 'icon.png'], ['MP4 loop', 'turntable.mp4']].map(([label, file]) => [label, `${folder(icon)}/${file}`])
    : preset ? [['GLB · web', `${folder(icon)}/colors/${preset}/model.glb`], ['PNG', `${folder(icon)}/colors/${preset}/icon.png`]] : []
  $('downloads').replaceChildren(...links.map(([label, href]) => el('a', { href, download: '', target: '_blank', rel: 'noopener', text: label })))
  $('custom-hint').hidden = Boolean(preset)
}

function openIcon(icon) {
  state.open = icon
  state.detailHex = PRESETS.find(([n]) => n === state.color)[1]
  $('detail-cat').textContent = icon.category
  $('detail-title').textContent = icon.title
  $('detail-desc').textContent = icon.description
  renderDetail()
  $('detail').showModal()
  history.replaceState(null, '', `#${icon.id}`)
}

$('close').onclick = () => $('detail').close()
$('detail').addEventListener('close', () => { $('viewer').src = 'about:blank'; history.replaceState(null, '', location.pathname) })
$('detail').addEventListener('click', e => { if (e.target === $('detail')) $('detail').close() })
$('search').addEventListener('input', e => { state.query = e.target.value; render() })
$('copy-embed').onclick = async () => {
  const code = `<iframe src="${location.origin}${viewerUrl(state.open, state.detailHex, false)}" title="3D ${state.open.title.toLowerCase()} icon" width="320" height="320" style="border:0;background:transparent" loading="lazy"></iframe>`
  await navigator.clipboard.writeText(code)
  $('copy-embed').textContent = 'Copied ✓'
  setTimeout(() => { $('copy-embed').textContent = 'Copy embed code' }, 1500)
}

data = await (await fetch('/icons/icons.json')).json()
render()
const linked = data.icons.find(icon => icon.id === location.hash.slice(1))
if (linked) openIcon(linked)
