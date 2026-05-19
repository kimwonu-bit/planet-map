"use client"

import { useRef, useMemo } from "react"
import { useFrame } from "@react-three/fiber"
import type { ThreeEvent } from "@react-three/fiber"
import { Sphere, Html } from "@react-three/drei"
import * as THREE from "three"
import type { Mesh, Group } from "three"
import type { SatelliteAppearance } from "./appearance"

export interface SatelliteData {
  id: string
  name: string
  level: number
  color: string
  orbitRadius: number
  orbitSpeed: number
  size: number
  isPlanned?: boolean
}

interface SatelliteProps {
  data: SatelliteData
  planetSize: number
  index: number
  appearance?: SatelliteAppearance
  onClick?: (data: SatelliteData) => void
}

export function Satellite({ data, planetSize, index, appearance, onClick }: SatelliteProps) {
  const groupRef = useRef<Group>(null)
  const satelliteRef = useRef<Mesh>(null)

  const actualOrbitRadius = planetSize + 0.8 + data.orbitRadius * 0.6
  const satelliteSize = (0.1 + data.size * 0.1) * (appearance?.scale ?? 1)
  const color = appearance?.color ?? data.color
  const glowColor = appearance?.glowColor ?? color

  // Orbit tilt
  const orbitTilt = useMemo(() => {
    return new THREE.Euler(
      (Math.random() - 0.5) * 0.3,
      0,
      (Math.random() - 0.5) * 0.3
    )
  }, [])

  // Initial angle offset
  const angleOffset = useMemo(() => (index * Math.PI * 2) / 7, [index])

  // Animation
  useFrame((state) => {
    if (groupRef.current) {
      const time = state.clock.elapsedTime * data.orbitSpeed * 0.5 + angleOffset
      groupRef.current.position.x = Math.cos(time) * actualOrbitRadius
      groupRef.current.position.z = Math.sin(time) * actualOrbitRadius
      groupRef.current.position.y = Math.sin(time * 0.3) * 0.1
    }
    if (satelliteRef.current) {
      satelliteRef.current.rotation.y += 0.005
    }
  })

  // Create orbit ring
  const orbitPoints = useMemo(() => {
    const points = []
    for (let i = 0; i <= 64; i++) {
      const angle = (i / 64) * Math.PI * 2
      points.push(
        new THREE.Vector3(
          Math.cos(angle) * actualOrbitRadius,
          0,
          Math.sin(angle) * actualOrbitRadius
        )
      )
    }
    return points
  }, [actualOrbitRadius])

  const orbitGeometry = useMemo(() => {
    return new THREE.BufferGeometry().setFromPoints(orbitPoints)
  }, [orbitPoints])

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    onClick?.(data)
  }

  return (
    <group rotation={orbitTilt}>
      {/* Orbit path - subtle */}
      <line>
        <primitive object={orbitGeometry} />
        <lineBasicMaterial
          color={data.isPlanned ? "#333" : color}
          transparent
          opacity={data.isPlanned ? 0.1 : 0.15}
        />
      </line>

      {/* Satellite */}
      <group ref={groupRef} onClick={handleClick}>
        {/* Glow */}
        <Sphere args={[satelliteSize * 1.5, 8, 8]}>
          <meshBasicMaterial
            color={glowColor}
            transparent
            opacity={data.isPlanned ? 0.02 : 0.08}
          />
        </Sphere>
        
        {/* Core */}
        <mesh ref={satelliteRef}>
          {appearance?.shape === "cube" ? (
            <boxGeometry args={[satelliteSize * 1.5, satelliteSize * 1.5, satelliteSize * 1.5]} />
          ) : appearance?.shape === "crystal" ? (
            <octahedronGeometry args={[satelliteSize * 1.25, 1]} />
          ) : (
            <sphereGeometry args={[satelliteSize, 12, 12]} />
          )}
          <meshStandardMaterial
            color={data.isPlanned ? "#444" : color}
            emissive={glowColor}
            emissiveIntensity={data.isPlanned ? 0.05 : 0.3}
            transparent={data.isPlanned}
            opacity={data.isPlanned ? 0.4 : 1}
            roughness={appearance?.shape === "crystal" ? 0.35 : 0.7}
            metalness={appearance?.shape === "crystal" ? 0.45 : 0.2}
          />
        </mesh>

        {/* Satellite label */}
        <Html
          position={[0, satelliteSize + 0.2, 0]}
          center
          distanceFactor={12}
          style={{ pointerEvents: "none", userSelect: "none" }}
        >
          <span
            className={`text-[9px] px-1.5 py-0.5 rounded whitespace-nowrap ${
              data.isPlanned
                ? "text-muted-foreground/50 bg-background/30"
                : "text-foreground/60 bg-background/40"
            }`}
          >
            {data.name}
            {!data.isPlanned && <span className="ml-1 opacity-60">L{data.level}</span>}
          </span>
        </Html>
      </group>
    </group>
  )
}
