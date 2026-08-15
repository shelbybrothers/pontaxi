import { useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'
import { City } from './world/City.jsx'
import { Player } from './world/Player.jsx'
import { NPCs, useCrowd } from './world/NPCs.jsx'
import { Traffic } from './world/Traffic.jsx'
import { Labels } from './world/Labels.jsx'
import { Interior } from './world/Interior.jsx'
import { Peers } from './world/Peers.jsx'
import { Sky, Lights, CameraRig } from './world/Stage.jsx'
import { Landing } from './ui/Landing.jsx'
import { Hud } from './ui/Hud.jsx'
import { useGame } from './state/store.js'
import { attachInput } from './lib/input.js'
import { connectRealm, disconnectRealm } from './net/realm.js'

function Scene() {
  const phase = useGame((s) => s.phase)
  const interior = useGame((s) => s.interior)
  const npcs = useCrowd()
  const outside = phase !== 'interior'

  return (
    <>
      <Sky />
      <Lights />
      <CameraRig />

      <group visible={outside}>
        <City />
        <Player npcs={npcs} />
        <NPCs npcs={npcs} />
        <Traffic />
        <Peers />
        <Labels />
      </group>

      {phase === 'interior' && <Interior landmarkKey={interior} />}
    </>
  )
}

export default function App() {
  const setReady = useGame((s) => s.setReady)
  const inCity = useGame((s) => s.phase !== 'title')

  useEffect(attachInput, [])

  // hold a socket only once someone is actually in the city
  useEffect(() => {
    if (!inCity) return
    connectRealm()
    return disconnectRealm
  }, [inCity])

  return (
    <>
      <div className="stage">
        <Canvas
          shadows
          dpr={[1, 1.75]}
          gl={{ antialias: true, powerPreference: 'high-performance' }}
          camera={{ fov: 38, near: 0.5, far: 600, position: [0, 96, 128] }}
          onCreated={({ gl, scene }) => {
            gl.toneMapping = THREE.NoToneMapping
            gl.shadowMap.type = THREE.PCFSoftShadowMap
            scene.fog = new THREE.Fog('#e6f0f9', 140, 340)
            // a beat so the first frame is painted behind the card — never rAF,
            // which never fires in a background tab and would strand the button
            setTimeout(() => setReady(true), 150)
          }}
        >
          <Scene />
        </Canvas>
      </div>

      <Landing />
      <Hud />
    </>
  )
}
