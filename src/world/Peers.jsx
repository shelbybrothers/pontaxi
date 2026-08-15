import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { VoxelChar, poseRig } from './Voxel.jsx'
import { peers, samplePeer } from '../net/realm.js'
import { useGame } from '../state/store.js'

// Name tags are sprites rather than DOM: they scale with distance for free and
// cost nothing when the city fills up.
const tagCache = new Map()

function nameTag(text) {
  const hit = tagCache.get(text)
  if (hit) return hit

  const pad = 18
  const font = '600 34px ui-monospace, Menlo, monospace'
  const measure = document.createElement('canvas').getContext('2d')
  measure.font = font
  const w = Math.ceil(measure.measureText(text).width) + pad * 2

  const c = document.createElement('canvas')
  c.width = w
  c.height = 64
  const ctx = c.getContext('2d')
  ctx.font = font
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  ctx.fillStyle = 'rgba(255,255,255,0.94)'
  ctx.beginPath()
  ctx.roundRect(0, 6, w, 52, 14)
  ctx.fill()

  ctx.fillStyle = '#1d2430'
  ctx.fillText(text, w / 2, 33)

  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  const made = { tex, aspect: w / 64 }
  tagCache.set(text, made)
  return made
}

function Peer({ peer }) {
  const group = useRef(null)
  const rig = useMemo(() => ({}), [])
  const walk = useRef(0)
  const tag = useMemo(() => nameTag(peer.name), [peer.name])

  useFrame((_, dt) => {
    const g = group.current
    if (!g) return
    const at = samplePeer(peer)
    if (!at) { g.visible = false; return }
    g.visible = true
    g.position.set(at.x, 0, at.z)
    g.rotation.y = at.yaw
    walk.current += Math.min(dt, 0.05) * (at.mv > 0.02 ? 2.1 + at.mv * 7.6 * 0.55 : 0)
    poseRig(rig, walk.current, at.mv > 0.02 ? Math.min(1, at.mv) : 0)
  })

  return (
    <group ref={group} visible={false}>
      <VoxelChar look={peer.look} rig={rig} />
      <sprite position={[0, 2.72, 0]} scale={[tag.aspect * 0.72, 0.72, 1]}>
        <spriteMaterial map={tag.tex} transparent depthTest={false} />
      </sprite>
    </group>
  )
}

export function Peers() {
  // re-renders only when someone joins or leaves; movement is all in useFrame
  const roster = useGame((s) => s.roster)
  const list = useMemo(() => [...peers.values()], [roster])

  return (
    <group>
      {list.map((p) => (
        <Peer key={p.id} peer={p} />
      ))}
    </group>
  )
}
