import { useLayoutEffect, useRef } from 'react'
import * as THREE from 'three'

const UNIT = new THREE.BoxGeometry(1, 1, 1)
const dummy = new THREE.Object3D()
const tint = new THREE.Color()

/**
 * One draw call for a pile of boxes (or any geometry).
 * items: [{ p:[x,y,z], s?:[x,y,z], yaw?:number, tilt?:number, color?:string }]
 */
export function Boxes({
  items,
  geometry = UNIT,
  color = '#ffffff',
  cast = false,
  receive = false,
  transparent = false,
  opacity = 1,
  side = THREE.FrontSide,
}) {
  const ref = useRef(null)

  useLayoutEffect(() => {
    const m = ref.current
    if (!m || !items.length) return
    const tinted = items.some((it) => it.color)
    for (let i = 0; i < items.length; i++) {
      const it = items[i]
      dummy.position.set(it.p[0], it.p[1], it.p[2])
      dummy.rotation.set(it.tilt || 0, it.yaw || 0, 0)
      const s = it.s || [1, 1, 1]
      dummy.scale.set(s[0], s[1], s[2])
      dummy.updateMatrix()
      m.setMatrixAt(i, dummy.matrix)
      if (tinted) m.setColorAt(i, tint.set(it.color || color))
    }
    m.instanceMatrix.needsUpdate = true
    if (m.instanceColor) m.instanceColor.needsUpdate = true
    m.computeBoundingSphere()
  }, [items, color])

  if (!items.length) return null

  return (
    <instancedMesh
      key={items.length}
      ref={ref}
      args={[geometry, undefined, items.length]}
      castShadow={cast}
      receiveShadow={receive}
    >
      <meshLambertMaterial
        color={color}
        transparent={transparent}
        opacity={opacity}
        side={side}
        depthWrite={!transparent}
      />
    </instancedMesh>
  )
}
