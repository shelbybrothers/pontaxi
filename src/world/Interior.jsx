import { useMemo, useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { VoxelChar, poseRig } from './Voxel.jsx'
import { LANDMARKS } from '../data/content.js'
import { useGame } from '../state/store.js'

const PLAYER_LOOK = { skin: '#f2d3b3', hair: '#3a2d24', shirt: '#f4c231', pants: '#39415a' }

export function Interior({ landmarkKey }) {
  const lm = useMemo(() => LANDMARKS.find((l) => l.key === landmarkKey), [landmarkKey])
  const hostRig = useMemo(() => ({}), [landmarkKey])
  const playerRig = useMemo(() => ({}), [landmarkKey])
  const t = useRef(0)
  const openDialogue = useGame((s) => s.openDialogue)

  useEffect(() => {
    if (!lm) return
    const i = lm.interior
    openDialogue({
      name: i.npc,
      role: i.role,
      accent: lm.accent,
      lines: i.lines,
      cta: i.cta,
      exitOnEnd: true,
    })
  }, [lm, openDialogue])

  useFrame((_, dt) => {
    t.current += dt
    // a small idle: the host breathes, the visitor shifts their weight
    poseRig(hostRig, t.current * 1.1, 0.06)
    poseRig(playerRig, t.current * 0.9, 0.05)
  })

  if (!lm) return null
  const accent = lm.accent

  return (
    <group position={[0, 0, 0]}>
      <ambientLight intensity={1.5} color="#f4f8ff" />
      <directionalLight position={[4, 9, 9]} intensity={1.35} color="#fff8ee" castShadow shadow-mapSize={[1024, 1024]} />

      {/* shell — deep enough that the camera sits inside the room */}
      <mesh position={[0, -0.1, 3]} receiveShadow>
        <boxGeometry args={[22, 0.2, 26]} />
        <meshLambertMaterial color="#eef1f7" />
      </mesh>
      <mesh position={[0, 6.1, 3]}>
        <boxGeometry args={[22, 0.2, 26]} />
        <meshLambertMaterial color="#fbfcfe" />
      </mesh>
      {[-11, 11].map((x) => (
        <mesh key={x} position={[x, 3, 3]}>
          <boxGeometry args={[0.3, 6.2, 26]} />
          <meshLambertMaterial color="#f5f7fb" />
        </mesh>
      ))}
      <mesh position={[0, 3, 15.9]}>
        <boxGeometry args={[22, 6.2, 0.3]} />
        <meshLambertMaterial color="#f5f7fb" />
      </mesh>

      {/* glazed back wall */}
      <mesh position={[0, 3, -9.9]}>
        <boxGeometry args={[22, 6.2, 0.3]} />
        <meshLambertMaterial color="#dceefb" />
      </mesh>
      {[-8.2, -4.1, 0, 4.1, 8.2].map((x) => (
        <mesh key={x} position={[x, 3, -9.66]}>
          <boxGeometry args={[0.22, 6.2, 0.12]} />
          <meshLambertMaterial color="#aab6c6" />
        </mesh>
      ))}
      {[1.4, 4.4].map((y) => (
        <mesh key={y} position={[0, y, -9.66]}>
          <boxGeometry args={[22, 0.2, 0.12]} />
          <meshLambertMaterial color="#aab6c6" />
        </mesh>
      ))}
      <mesh position={[0, 0.5, -9.55]}>
        <boxGeometry args={[22, 1, 0.14]} />
        <meshLambertMaterial color="#f6d97a" />
      </mesh>

      {/* accent rug */}
      <mesh position={[0, 0.02, -1.6]} receiveShadow>
        <boxGeometry args={[11, 0.06, 8]} />
        <meshLambertMaterial color={accent} />
      </mesh>
      <mesh position={[0, 0.05, -1.6]} receiveShadow>
        <boxGeometry args={[10.4, 0.06, 7.4]} />
        <meshLambertMaterial color="#f7f9fc" />
      </mesh>

      <Desk x={0} z={-3.2} w={5.6} accent={accent} main />
      <Desk x={-7.8} z={2.4} w={4.4} yaw={0.5} accent={accent} />
      <Desk x={7.8} z={2.4} w={4.4} yaw={-0.5} accent={accent} />

      <Plant x={-9} z={-7.2} />
      <Plant x={9} z={-7.2} />

      {/* the host, behind the desk */}
      <group position={[0, 0, -5.1]}>
        <VoxelChar look={lm.interior.look} rig={hostRig} />
      </group>
      <Chair x={0} z={-6.0} />

      {/* you, with your back to the door */}
      <group position={[-0.15, 0, 1.4]} rotation-y={Math.PI}>
        <VoxelChar look={PLAYER_LOOK} rig={playerRig} />
      </group>
    </group>
  )
}

function Desk({ x, z, w, yaw = 0, accent, main = false }) {
  return (
    <group position={[x, 0, z]} rotation-y={yaw}>
      <mesh position={[0, 1.16, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, 0.24, 2.1]} />
        <meshLambertMaterial color="#b98a5e" />
      </mesh>
      <mesh position={[0, 0.6, 0.9]} castShadow>
        <boxGeometry args={[w, 1.1, 0.2]} />
        <meshLambertMaterial color="#a97b52" />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[(s * (w - 0.4)) / 2, 0.58, -0.6]} castShadow>
          <boxGeometry args={[0.26, 1.16, 0.9]} />
          <meshLambertMaterial color="#a97b52" />
        </mesh>
      ))}
      {main && (
        <>
          <mesh position={[-1.5, 1.3, 0.1]}>
            <boxGeometry args={[1.1, 0.04, 0.8]} />
            <meshLambertMaterial color={accent} />
          </mesh>
          <mesh position={[1.5, 1.45, -0.2]} castShadow>
            <boxGeometry args={[0.9, 0.34, 0.7]} />
            <meshLambertMaterial color="#5a6274" />
          </mesh>
          <mesh position={[0.1, 1.31, 0.25]} rotation-y={0.2}>
            <boxGeometry args={[0.7, 0.03, 0.5]} />
            <meshLambertMaterial color="#fdfefe" />
          </mesh>
        </>
      )}
      {!main && (
        <mesh position={[0.5, 1.45, -0.2]} castShadow>
          <boxGeometry args={[0.9, 0.34, 0.7]} />
          <meshLambertMaterial color="#4f5768" />
        </mesh>
      )}
    </group>
  )
}

function Chair({ x, z }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.62, 0]} castShadow>
        <boxGeometry args={[1.1, 0.18, 1.1]} />
        <meshLambertMaterial color="#3f4759" />
      </mesh>
      <mesh position={[0, 1.28, -0.48]} castShadow>
        <boxGeometry args={[1.1, 1.2, 0.18]} />
        <meshLambertMaterial color="#3f4759" />
      </mesh>
      <mesh position={[0, 0.28, 0]}>
        <boxGeometry args={[0.2, 0.7, 0.2]} />
        <meshLambertMaterial color="#5a6274" />
      </mesh>
    </group>
  )
}

function Plant({ x, z }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.4, 0]} castShadow>
        <boxGeometry args={[0.9, 0.8, 0.9]} />
        <meshLambertMaterial color="#e3e7ee" />
      </mesh>
      <mesh position={[0, 1.5, 0]} castShadow>
        <boxGeometry args={[1.5, 1.5, 1.5]} />
        <meshLambertMaterial color="#83cd88" />
      </mesh>
      <mesh position={[0.15, 2.4, -0.1]} castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshLambertMaterial color="#95d99a" />
      </mesh>
    </group>
  )
}
