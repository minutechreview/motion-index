// Hero: a transparent 3D layer in the page itself. The headline types an icon's name and calls
// show(id): the old icon spins away and shrinks, the new one pops in with a springy overshoot.
// Drag turns the current icon; it also follows the pointer a little.
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js'
import { tint } from './recolor.js'

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
const POP_MS = 900
const OUT_MS = 380

export function createStage(canvas, { base }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  const scene = new THREE.Scene()
  scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture
  const key = new THREE.DirectionalLight(0xffffff, 1.6)
  key.position.set(3, 5, 4)
  const rim = new THREE.DirectionalLight(0xffffff, 0.8)
  rim.position.set(-4, 2, -3)
  scene.add(key, rim)
  const cam = new THREE.PerspectiveCamera(26, 1, 0.1, 100)
  cam.position.set(0, 1.1, 5)
  cam.lookAt(0, 0, 0)

  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder)
  const cache = new Map()
  const load = id => {
    if (!cache.has(id)) {
      cache.set(id, loader.loadAsync(`${base}/icons/${id}/model.glb`).then(gltf => {
        const obj = gltf.scene
        const box = new THREE.Box3().setFromObject(obj)
        const size = box.getSize(new THREE.Vector3())
        obj.position.sub(box.getCenter(new THREE.Vector3()))
        const pivot = new THREE.Group()
        pivot.add(obj)
        pivot.userData.fit = 1.12 / Math.max(size.x, size.y, size.z)
        return pivot
      }))
    }
    return cache.get(id)
  }

  let color = 'ff6200'
  let current = null
  let leaving = null
  let spin = 0
  let drag = null
  const pointer = { x: 0, y: 0 }

  canvas.addEventListener('pointerdown', e => { drag = { x: e.clientX, spin }; canvas.setPointerCapture(e.pointerId) })
  canvas.addEventListener('pointermove', e => { if (drag) spin = drag.spin + (e.clientX - drag.x) * 0.012 })
  canvas.addEventListener('pointerup', () => { drag = null })
  addEventListener('pointermove', e => {
    pointer.x = (e.clientX / innerWidth) * 2 - 1
    pointer.y = (e.clientY / innerHeight) * 2 - 1
  }, { passive: true })

  async function show(id) {
    const next = await load(id)
    tint(next, color)
    if (current && current !== next) {
      leaving = { obj: current, start: performance.now() }
    }
    current = next
    current.userData.start = performance.now()
    spin = -2.2 // arrives turning, settles to a three-quarter view
    scene.add(current)
  }

  const ease = t => 1 - Math.pow(1 - t, 3)
  const spring = t => 1 - Math.exp(-6 * t) * Math.cos(t * 9) // overshoot, then settle

  function frame(now) {
    const w = canvas.clientWidth, h = canvas.clientHeight
    if (canvas.width !== Math.floor(w * renderer.getPixelRatio()) || canvas.height !== Math.floor(h * renderer.getPixelRatio())) {
      renderer.setSize(w, h, false)
      cam.aspect = w / h
      cam.updateProjectionMatrix()
    }
    if (!drag) spin += (-0.5 - spin) * 0.05 // ease back to the resting three-quarter angle
    if (leaving) {
      const t = Math.min(1, (now - leaving.start) / OUT_MS)
      leaving.obj.scale.setScalar(leaving.obj.userData.fit * (1 - ease(t)))
      leaving.obj.rotation.y += 0.25
      leaving.obj.position.y = ease(t) * 0.6
      if (t >= 1) { scene.remove(leaving.obj); leaving.obj.position.y = 0; leaving = null }
    }
    if (current) {
      const t = reduced ? 1 : Math.min(1, (now - current.userData.start) / POP_MS)
      current.scale.setScalar(current.userData.fit * Math.max(0.001, spring(t)))
      current.rotation.y = spin + (reduced ? 0 : Math.sin(now / 1600) * 0.25)
      current.rotation.x = reduced ? 0 : pointer.y * 0.12
      current.rotation.z = reduced ? 0 : -pointer.x * 0.06
      current.position.y = reduced ? 0 : Math.sin(now / 900) * 0.07
    }
    renderer.render(scene, cam)
    requestAnimationFrame(frame)
  }
  requestAnimationFrame(frame)

  return {
    show,
    preload: id => load(id),
    setColor(hex) {
      color = hex
      if (current) tint(current, hex)
    }
  }
}
