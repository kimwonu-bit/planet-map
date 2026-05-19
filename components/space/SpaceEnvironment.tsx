"use client"

import { useRef, useMemo } from "react"
import { useFrame } from "@react-three/fiber"
import { Points, PointMaterial } from "@react-three/drei"
import * as THREE from "three"
import type { Points as PointsType } from "three"

export function StarField({ count = 3000, radius = 80 }: { count?: number; radius?: number }) {
  const pointsRef = useRef<PointsType>(null)

  const positions = useMemo(() => {
    const positions = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const theta = THREE.MathUtils.randFloatSpread(360)
      const phi = THREE.MathUtils.randFloatSpread(360)
      const r = radius * (0.6 + Math.random() * 0.4)

      positions[i * 3] = r * Math.sin(theta) * Math.cos(phi)
      positions[i * 3 + 1] = r * Math.sin(theta) * Math.sin(phi)
      positions[i * 3 + 2] = r * Math.cos(theta)
    }
    return positions
  }, [count, radius])

  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.x = state.clock.elapsedTime * 0.003
      pointsRef.current.rotation.y = state.clock.elapsedTime * 0.002
    }
  })

  return (
    <Points ref={pointsRef} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color="#ffffff"
        size={0.08}
        sizeAttenuation={true}
        depthWrite={false}
        opacity={0.5}
      />
    </Points>
  )
}

export function Nebula({ color = "#2dd4bf", position = [0, 0, -40] as [number, number, number] }) {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.z = state.clock.elapsedTime * 0.005
    }
  })

  const nebulaTexture = useMemo(() => {
    const canvas = document.createElement("canvas")
    canvas.width = 256
    canvas.height = 256
    const ctx = canvas.getContext("2d")
    if (!ctx) return null

    const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128)
    gradient.addColorStop(0, `${color}15`)
    gradient.addColorStop(0.5, `${color}08`)
    gradient.addColorStop(1, "transparent")
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 256, 256)

    const texture = new THREE.CanvasTexture(canvas)
    texture.needsUpdate = true
    return texture
  }, [color])

  return (
    <mesh ref={meshRef} position={position}>
      <planeGeometry args={[60, 60]} />
      {nebulaTexture && (
        <meshBasicMaterial
          map={nebulaTexture}
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      )}
    </mesh>
  )
}

export function GalaxyDust({ count = 800, spread = 40 }: { count?: number; spread?: number }) {
  const pointsRef = useRef<PointsType>(null)

  const positions = useMemo(() => {
    const positions = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 4
      const r = Math.random() * spread
      const spiralOffset = angle * 0.3

      positions[i * 3] = Math.cos(angle + spiralOffset) * r + (Math.random() - 0.5) * 3
      positions[i * 3 + 1] = (Math.random() - 0.5) * 2
      positions[i * 3 + 2] = Math.sin(angle + spiralOffset) * r + (Math.random() - 0.5) * 3
    }
    return positions
  }, [count, spread])

  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = state.clock.elapsedTime * 0.01
    }
  })

  return (
    <Points ref={pointsRef} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color="#60a5fa"
        size={0.05}
        sizeAttenuation={true}
        depthWrite={false}
        opacity={0.3}
        blending={THREE.AdditiveBlending}
      />
    </Points>
  )
}
