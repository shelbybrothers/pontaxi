import { useMemo } from 'react'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

// A blocky local: the head/torso are merged into one geometry with vertex
// colours, and only the four limbs stay separate so they can swing.

const bodyCache = new Map()
const matCache = new Map()

export function flatMat(color) {
  let m = matCache.get(color)
  if (!m) {
    m = new THREE.MeshLambertMaterial({ color })
    matCache.set(color, m)
  }
  return m
}

const VERTEX_MAT = new THREE.MeshLambertMaterial({ vertexColors: true })

function box(w, h, d, x, y, z, hex) {
  const g = new THREE.BoxGeometry(w, h, d)
  g.translate(x, y, z)
  const c = new THREE.Color(hex)
  const n = g.attributes.position.count
  const col = new Float32Array(n * 3)
  for (let i = 0; i < n; i++) {
    col[i * 3] = c.r
    col[i * 3 + 1] = c.g
    col[i * 3 + 2] = c.b
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3))
  return g
}

/** Torso + head + hair + hat + face, merged. */
export function bodyGeometry(look) {
  const key = JSON.stringify(look)
  const hit = bodyCache.get(key)
  if (hit) return hit

  const { skin = '#f2d3b3', hair = '#3a2d24', shirt = '#7aa7e8', hat } = look
  const parts = [
    box(0.86, 0.74, 0.52, 0, 0.99, 0, shirt), // torso
    box(0.9, 0.12, 0.56, 0, 0.6, 0, shirt), // hem
    box(0.74, 0.66, 0.68, 0, 1.68, 0, skin), // head
    box(0.78, 0.2, 0.72, 0, 1.94, 0, hair), // hair top
    box(0.78, 0.42, 0.16, 0, 1.74, -0.29, hair), // hair back
    box(0.1, 0.14, 0.04, -0.17, 1.72, 0.35, '#232a36'), // eyes
    box(0.1, 0.14, 0.04, 0.17, 1.72, 0.35, '#232a36'),
  ]
  if (hat) {
    parts.push(box(0.86, 0.22, 0.8, 0, 2.06, 0, hat))
    parts.push(box(0.86, 0.08, 0.34, 0, 1.95, 0.4, hat))
  }
  const g = mergeGeometries(parts, false)
  parts.forEach((p) => p.dispose())
  bodyCache.set(key, g)
  return g
}

const ARM_GEO = new THREE.BoxGeometry(0.23, 0.62, 0.32)
ARM_GEO.translate(0, -0.31, 0)
const LEG_GEO = new THREE.BoxGeometry(0.32, 0.62, 0.36)
LEG_GEO.translate(0, -0.31, 0)

/**
 * `rig` is a plain object the parent mutates each frame; we just park the
 * three.js objects on it. No state, no per-character useFrame.
 */
export function VoxelChar({ look, rig, kid = false, castShadow = true }) {
  const geo = useMemo(() => bodyGeometry(look), [look])
  const skinMat = flatMat(look.skin || '#f2d3b3')
  const pantMat = flatMat(look.pants || '#39415a')
  const s = kid ? 0.74 : 1

  return (
    <group scale={s}>
      <mesh
        geometry={geo}
        material={VERTEX_MAT}
        castShadow={castShadow}
        ref={(o) => { if (rig) rig.body = o }}
      />
      <group position={[-0.55, 1.3, 0]} ref={(o) => { if (rig) rig.armL = o }}>
        <mesh geometry={ARM_GEO} material={skinMat} castShadow={castShadow} />
      </group>
      <group position={[0.55, 1.3, 0]} ref={(o) => { if (rig) rig.armR = o }}>
        <mesh geometry={ARM_GEO} material={skinMat} castShadow={castShadow} />
      </group>
      <group position={[-0.19, 0.62, 0]} ref={(o) => { if (rig) rig.legL = o }}>
        <mesh geometry={LEG_GEO} material={pantMat} castShadow={castShadow} />
      </group>
      <group position={[0.19, 0.62, 0]} ref={(o) => { if (rig) rig.legR = o }}>
        <mesh geometry={LEG_GEO} material={pantMat} castShadow={castShadow} />
      </group>
    </group>
  )
}

/** Drive a rig's limbs. `t` is a walk phase, `speed` scales the swing. */
export function poseRig(rig, t, speed) {
  const a = Math.sin(t) * 0.62 * speed
  if (rig.legL) rig.legL.rotation.x = a
  if (rig.legR) rig.legR.rotation.x = -a
  if (rig.armL) rig.armL.rotation.x = -a * 0.85
  if (rig.armR) rig.armR.rotation.x = a * 0.85
  if (rig.body) rig.body.position.y = Math.abs(Math.sin(t)) * 0.055 * speed
}
