// Icon Index page: hero stage, ticker, catalogue of spinning icons (one looping video per card,
// played only while on screen), paint-chip colours and the detail sheet. Data: icons.json.
import { PRESETS } from './recolor.js'

const CATEGORIES = ['All', 'Tech', 'Money', 'Social', 'Work']
const $ = id => document.getElementById(id)
const state = { category: 'All', query: '', color: 'orange', open: null, sheetHex: 'ff6200' }
const data = await (await fetch('/icons/icons.json')).json()
const number = icon => `No. ${String(data.icons.indexOf(icon) + 1).padStart(2, '0')}`
const hexOf = name => PRESETS.find(([n]) => n === name)?.[1]
const nameOf = hex => PRESETS.find(([, h]) => h === hex)?.[0] || ''
const folder = (icon, color = 'orange') => `${data.asset_base}/icons/${icon.id}${color === 'orange' ? '' : `/colors/${color}`}`
const viewerUrl = (icon, hex, dl) => `/icons/viewer.html#id=${icon.id}${hex !== 'ff6200' ? `&color=${hex}` : ''}${dl ? '&dl=1' : ''}`

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag)
  for (const [key, value] of Object.entries(attrs)) {
    if (key === 'text') node.textContent = value
    else if (key.startsWith('on')) node.addEventListener(key.slice(2), value)
    else node.setAttribute(key, value)
  }
  node.append(...[].concat(children).filter(Boolean))
  return node
}

// Colour dots. The custom dot opens the system colour picker.
function chips(container, activeHex, onPick, withCustom) {
  const list = PRESETS.map(([name, hex]) => el('button', {
    class: 'chip', type: 'button', title: name, 'aria-pressed': String(activeHex === hex), 'aria-label': `${name} accent`,
    style: `--c:#${hex}`, onclick: () => onPick(hex)
  }))
  if (withCustom) {
    const custom = !nameOf(activeHex)
    const picker = el('input', { type: 'color', value: `#${activeHex}`, 'aria-label': 'Any colour', oninput: e => onPick(e.target.value.slice(1).toLowerCase()) })
    list.push(el('label', { class: `chip custom${custom ? ' set' : ''}`, title: 'Any colour', 'aria-pressed': String(custom), style: `--c:#${activeHex}` }, [picker]))
  }
  container.replaceChildren(...list)
}

// ---- catalogue -------------------------------------------------------------------------------
const playing = new IntersectionObserver(entries => {
  for (const entry of entries) {
    const card = entry.target
    const video = card.querySelector('video')
    if (entry.isIntersecting) {
      card.classList.add('in')
      if (!video.src) {
        // stagger the loops so the wall doesn't turn edge-on all at once
        video.addEventListener('loadedmetadata', () => { video.currentTime = Number(video.dataset.offset) % video.duration }, { once: true })
        video.src = video.dataset.src
      }
      video.play().catch(() => {})
    } else {
      video.pause()
    }
  }
}, { rootMargin: '120px' })

function card(icon, i) {
  const video = el('video', { muted: '', loop: '', playsinline: '', preload: 'none', 'data-src': `${folder(icon, state.color)}/spin.mp4`, 'data-offset': String((i * 1.37) % 4), 'aria-hidden': 'true' })
  video.muted = true
  video.addEventListener('playing', () => video.classList.add('playing'))
  const node = el('button', { class: 'card', type: 'button', style: `transition-delay:${(i % 8) * 45}ms`, 'aria-label': `Open ${icon.title}`, onclick: () => openSheet(icon) }, [
    el('div', { class: 'media' }, [el('img', { src: `${folder(icon, state.color)}/icon.png`, alt: '', loading: 'lazy' }), video, el('span', { class: 'open mono', text: 'Open →' })]),
    el('div', { class: 'meta' }, [el('b', { text: icon.title }), el('span', { class: 'mono', text: number(icon) })])
  ])
  playing.observe(node)
  return node
}

function renderGrid() {
  const words = state.query.toLowerCase().split(/\s+/).filter(Boolean)
  const list = data.icons.filter(icon => (state.category === 'All' || icon.category === state.category) &&
    words.every(w => `${icon.title} ${icon.category} ${icon.description} ${icon.tags.join(' ')}`.toLowerCase().includes(w)))
  playing.disconnect()
  $('grid').replaceChildren(...list.map(card))
  $('empty').hidden = list.length > 0
  $('count').textContent = `${list.length} object${list.length === 1 ? '' : 's'}`
}

function renderTabs() {
  $('tabs').replaceChildren(...CATEGORIES.map(name => {
    const n = name === 'All' ? data.icons.length : data.icons.filter(i => i.category === name).length
    return el('button', { role: 'tab', type: 'button', 'aria-selected': String(state.category === name), onclick: () => { state.category = name; renderTabs(); renderGrid() } },
      [name, el('sup', { text: n })])
  }))
}

function setColor(hex) {
  state.color = nameOf(hex) || 'orange'
  chips($('chips'), hexOf(state.color), setColor, false)
  chips($('hero-chips'), hexOf(state.color), setColor, false)
  stage?.setColor(hexOf(state.color))
  renderGrid()
}

// ---- detail sheet ----------------------------------------------------------------------------
function renderSheet() {
  const icon = state.open
  const hex = state.sheetHex
  const preset = nameOf(hex)
  $('viewer').src = viewerUrl(icon, hex, true)
  chips($('d-chips'), hex, next => { state.sheetHex = next; renderSheet() }, true)
  const rows = preset === 'orange'
    ? [['GLB · web', 'model.glb', 'Websites, three.js'], ['GLB · full', 'model-full.glb', 'Blender, Unity'], ['PNG', 'icon.png', 'Slides, docs'], ['MP4 loop', 'turntable.mp4', 'Video, reels']]
    : preset ? [['GLB · web', 'model.glb', 'Websites, three.js'], ['PNG', 'icon.png', 'Slides, docs'], ['MP4 loop', 'spin.mp4', 'Video, reels']] : []
  $('d-files').replaceChildren(...rows.map(([label, file, use]) => el('li', {}, [
    el('a', { href: `${folder(icon, preset)}/${file}`, download: '', target: '_blank', rel: 'noopener' }, [el('b', { text: label }), el('small', { text: use }), el('span', { text: '↓' })])
  ])))
  $('d-custom').hidden = Boolean(preset)
}

function openSheet(icon) {
  state.open = icon
  state.sheetHex = hexOf(state.color)
  $('d-no').textContent = `${number(icon)} — ${icon.category}`
  $('d-title').textContent = icon.title
  $('d-desc').textContent = icon.description
  renderSheet()
  $('detail').showModal()
  history.replaceState(null, '', `#${icon.id}`)
}

$('close').onclick = () => $('detail').close()
$('detail').addEventListener('close', () => { $('viewer').src = 'about:blank'; history.replaceState(null, '', location.pathname) })
$('detail').addEventListener('click', e => { if (e.target === $('detail')) $('detail').close() })
$('copy').onclick = async () => {
  const code = `<iframe src="${location.origin}${viewerUrl(state.open, state.sheetHex, false)}" title="3D ${state.open.title.toLowerCase()} icon" width="320" height="320" style="border:0;background:transparent" loading="lazy"></iframe>`
  await navigator.clipboard.writeText(code)
  $('copy').textContent = 'Copied ✓'
  setTimeout(() => { $('copy').textContent = 'Copy embed code' }, 1600)
}
$('search').addEventListener('input', e => { state.query = e.target.value; renderGrid() })

// ---- ticker + hero ---------------------------------------------------------------------------
const names = data.icons.map(i => el('span', { text: i.title }))
$('ticker').replaceChildren(...names, ...names.map(n => n.cloneNode(true)))

// Headline: the icon name deletes and retypes itself, and that icon pops into the page.
const HERO = [['rocket', 'rocket'], ['wallet', 'wallet'], ['robot', 'robot'], ['trophy', 'trophy'],
  ['padlock', 'lock'], ['light bulb', 'bulb'], ['gift', 'gift'], ['chat bubble', 'chat']]
let stage = null
try {
  const { createStage } = await import('./hero.js')
  stage = createStage($('stage'), { base: data.asset_base })
  HERO.forEach(([, id]) => stage.preload(id))
} catch { /* no WebGL: the headline still types */ }

const wait = ms => new Promise(resolve => setTimeout(resolve, ms))
async function typeLoop() {
  const text = $('rot-text'), caret = $('caret')
  let i = 0
  stage?.show(HERO[0][1])
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
  for (;;) {
    await wait(2600)
    caret.classList.add('typing')
    for (let n = text.textContent.length; n > 0; n--) { text.textContent = text.textContent.slice(0, -1); await wait(34) }
    i = (i + 1) % HERO.length
    const [word, id] = HERO[i]
    await wait(160)
    for (let n = 1; n <= word.length; n++) { text.textContent = word.slice(0, n); await wait(68) }
    stage?.show(id)
    caret.classList.remove('typing')
  }
}
document.fonts.ready.then(typeLoop)

renderTabs()
setColor('ff6200')
const linked = data.icons.find(icon => icon.id === location.hash.slice(1))
if (linked) openSheet(linked)
