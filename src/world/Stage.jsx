import { useMemo, useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { live, useGame } from '../state/store.js'
import { CAM_YAW } from './Player.jsx'

// ------------------------------------------------------------------- the sky
function skyTexture() {
  const c = document.createElement('canvas')
  c.width = 4
  c.height = 256
  const ctx = c.getContext('2d')
  const grd = ctx.createLinearGradient(0, 0, 0, 256)
  grd.addColorStop(0, '#8fc2ea')
  grd.addColorStop(0.42, '#c7e0f3')
  grd.addColorStop(0.62, '#e9f3fb')
  grd.addColorStop(1, '#f6fafd')
  ctx.fillStyle = grd
  ctx.fillRect(0, 0, 4, 256)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

export function Sky() {
  const tex = useMemo(skyTexture, [])
  return (
    <mesh scale={[-1, 1, 1]} renderOrder={-1}>
      <sphereGeometry args={[380, 24, 16]} />
      <meshBasicMaterial map={tex} fog={false} depthWrite={false} side={THREE.BackSide} />
    </mesh>
  )
}

// ---------------------------------------------------------------- the lights
export function Lights() {
  const dir = useRef(null)
  const target = useMemo(() => new THREE.Object3D(), [])
  const { scene } = useThree()

  useEffect(() => {
    scene.add(target)
    return () => { scene.remove(target) }
  }, [scene, target])

  useFrame(() => {
    const l = dir.current
    if (!l) return
    const st = useGame.getState()
    const cx = st.phase === 'city' ? live.px : 0
    const cz = st.phase === 'city' ? live.pz : 0
    l.position.set(cx + 46, 74, cz + 34)
    target.position.set(cx, 0, cz)
    l.target = target
    l.target.updateMatrixWorld()
  })

  return (
    <>
      <ambientLight intensity={1.25} color="#eef5fc" />
      <hemisphereLight args={['#dbeaf7', '#c2c8d2', 0.55]} />
      <directionalLight
        ref={dir}
        intensity={1.6}
        color="#fff7ea"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-52}
        shadow-camera-right={52}
        shadow-camera-top={52}
        shadow-camera-bottom={-52}
        shadow-camera-near={1}
        shadow-camera-far={190}
        shadow-bias={-0.0007}
        shadow-normalBias={0.035}
      />
    </>
  )
}

// ---------------------------------------------------------------- the camera
const CITY_DIST = 32
const CITY_HEIGHT = 29
const INTERIOR_POS = [0, 4.1, 9.8]
const INTERIOR_LOOK = [0, 2.0, -2.6]

export function CameraRig() {
  const { camera } = useThree()
  const look = useRef(new THREE.Vector3(0, 2, 0))
  const prev = useRef('title')
  const blend = useRef(0)
  const orbit = useRef(0)

  useFrame((_, dt) => {
    const st = useGame.getState()
    const step = Math.min(dt, 0.05)
    const phase = st.phase

    if (phase !== prev.current) {
      if (phase === 'interior' || prev.current === 'interior') blend.current = -1 // hard cut
      else blend.current = 1.7
      prev.current = phase
    }

    let px, py, pz, lx, ly, lz

    if (phase === 'interior') {
      ;[px, py, pz] = INTERIOR_POS
      ;[lx, ly, lz] = INTERIOR_LOOK
    } else if (phase === 'title') {
      orbit.current += step * 0.035
      const a = orbit.current
      px = Math.sin(a) * 128
      py = 96
      pz = Math.cos(a) * 128
      lx = 0
      ly = 4
      lz = 0
    } else {
      px = live.px + Math.sin(CAM_YAW) * CITY_DIST
      py = CITY_HEIGHT
      pz = live.pz + Math.cos(CAM_YAW) * CITY_DIST
      lx = live.px
      ly = 1.7
      lz = live.pz
    }

    if (blend.current < 0) {
      camera.position.set(px, py, pz)
      look.current.set(lx, ly, lz)
      blend.current = 0
    } else {
      const swooping = blend.current > 0
      if (swooping) blend.current = Math.max(0, blend.current - step)
      const k = 1 - Math.exp(-(swooping ? 2.1 : 6.5) * step)
      camera.position.x += (px - camera.position.x) * k
      camera.position.y += (py - camera.position.y) * k
      camera.position.z += (pz - camera.position.z) * k
      look.current.x += (lx - look.current.x) * k
      look.current.y += (ly - look.current.y) * k
      look.current.z += (lz - look.current.z) * k
    }
    camera.lookAt(look.current)
  })

  return null
}
