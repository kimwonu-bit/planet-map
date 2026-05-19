"use client"

import { useRef, useState, useCallback } from "react"
import { Canvas, useThree, useFrame } from "@react-three/fiber"
import { Html, OrbitControls, PerspectiveCamera } from "@react-three/drei"
import * as THREE from "three"
import { Planet, type PlanetData, type SatelliteData } from "./Planet"
import { StarField, Nebula, GalaxyDust } from "./SpaceEnvironment"
import type { PlanetAppearance, SatelliteAppearance } from "./appearance"

interface SolarSystemProps {
  planets: PlanetData[]
  onPlanetSelect?: (planet: PlanetData | null) => void
  onSatelliteSelect?: (planet: PlanetData, satellite: SatelliteData) => void
  selectedPlanetId?: string | null
  accountName?: string
  starTemperature?: number
  starBrightness?: number
  isSupernova?: boolean
  planetAppearances?: Record<string, PlanetAppearance>
  satelliteAppearances?: Record<string, Record<string, SatelliteAppearance>>
}

function CameraController({ target }: { target: THREE.Vector3 | null }) {
  const { camera } = useThree()
  const currentTarget = useRef(new THREE.Vector3(0, 0, 0))
  
  useFrame(() => {
    if (target) {
      currentTarget.current.lerp(target, 0.03)
      camera.lookAt(currentTarget.current)
    }
  })
  
  return null
}

function SolarSystemScene({
  planets,
  onPlanetSelect,
  onSatelliteSelect,
  selectedPlanetId,
  accountName,
  starTemperature = 3400,
  starBrightness = 0.35,
  isSupernova = false,
  planetAppearances,
  satelliteAppearances,
}: SolarSystemProps) {
  const [cameraTarget, setCameraTarget] = useState<THREE.Vector3 | null>(null)
  const starRef = useRef<THREE.Mesh>(null)

  const starCoreColor = starTemperature >= 6200 ? "#f4f7ff" : starTemperature >= 5000 ? "#fff3c4" : "#ffb36b"
  const starGlowColor = isSupernova ? "#93c5fd" : starTemperature >= 5000 ? "#fde68a" : "#fb923c"
  const coreSize = isSupernova ? 2.25 : 1.55 + starBrightness * 0.35
  const glowSize = isSupernova ? 3.4 : coreSize * 1.55

  const handlePlanetClick = useCallback((planet: PlanetData) => {
    onPlanetSelect?.(planet)
    setCameraTarget(new THREE.Vector3(...planet.position))
  }, [onPlanetSelect])

  const handleBackgroundClick = useCallback(() => {
    onPlanetSelect?.(null)
    setCameraTarget(null)
  }, [onPlanetSelect])

  useFrame((state) => {
    if (!starRef.current) return

    const pulseSpeed = isSupernova ? 6 : 2
    const pulseRange = isSupernova ? 0.18 : 0.04
    const pulse = 1 + Math.sin(state.clock.elapsedTime * pulseSpeed) * pulseRange
    starRef.current.scale.setScalar(pulse)
  })

  return (
    <>
      <CameraController target={cameraTarget} />
      
      {/* Subtle lighting */}
      <ambientLight intensity={0.15} />
      <pointLight position={[0, 0, 0]} intensity={1.1 + starBrightness * 1.8} color={starGlowColor} />
      <pointLight position={[30, 15, 20]} intensity={0.3} color="#60a5fa" />
      <pointLight position={[-30, -15, -20]} intensity={0.2} color="#a78bfa" />

      {/* Background click handler */}
      <mesh onClick={handleBackgroundClick} position={[0, 0, -100]}>
        <planeGeometry args={[500, 500]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      {/* Space environment - more subtle */}
      <StarField count={2500} radius={100} />
      <GalaxyDust count={600} spread={50} />
      <Nebula color="#2dd4bf" position={[-50, 25, -70]} />
      <Nebula color="#a78bfa" position={[40, -20, -60]} />

      {/* Central star - subtle glow */}
      <mesh ref={starRef} position={[0, 0, 0]}>
        <sphereGeometry args={[coreSize, 32, 32]} />
        <meshBasicMaterial color={starCoreColor} />
      </mesh>
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[glowSize, 32, 32]} />
        <meshBasicMaterial color={starGlowColor} transparent opacity={0.12 + starBrightness * 0.18} />
      </mesh>
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[glowSize * 1.55, 32, 32]} />
        <meshBasicMaterial color={isSupernova ? "#bfdbfe" : starGlowColor} transparent opacity={isSupernova ? 0.16 : 0.04 + starBrightness * 0.06} />
      </mesh>
      {accountName && (
        <Html
          position={[0, coreSize + 0.7, 0]}
          center
          distanceFactor={12}
          style={{ pointerEvents: "none", userSelect: "none" }}
        >
          <div className="text-center">
            <span className="text-xs font-medium text-foreground/80 bg-background/55 px-2 py-0.5 rounded backdrop-blur-sm whitespace-nowrap">
              {accountName}
            </span>
            <span className="block text-[10px] text-muted-foreground/70 mt-0.5">
              {isSupernova ? "Supernova" : `${starTemperature.toLocaleString()}K`}
            </span>
          </div>
        </Html>
      )}

      {/* Planets */}
      {planets.map((planet) => (
        <Planet
          key={planet.id}
          data={planet}
          onClick={handlePlanetClick}
          onSatelliteClick={onSatelliteSelect}
          isSelected={selectedPlanetId === planet.id}
          appearance={planetAppearances?.[planet.id]}
          satelliteAppearances={satelliteAppearances?.[planet.id]}
        />
      ))}
    </>
  )
}

export function SolarSystem({
  planets,
  onPlanetSelect,
  onSatelliteSelect,
  selectedPlanetId,
  accountName,
  starTemperature,
  starBrightness,
  isSupernova,
  planetAppearances,
  satelliteAppearances,
}: SolarSystemProps) {
  return (
    <Canvas
      style={{ background: "transparent" }}
      gl={{ antialias: true, alpha: true }}
      dpr={[1, 1.5]}
    >
      <PerspectiveCamera makeDefault position={[0, 10, 24]} fov={52} />
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={8}
        maxDistance={60}
        autoRotate
        autoRotateSpeed={0.15}
        dampingFactor={0.05}
        enableDamping
      />
      <SolarSystemScene
        planets={planets}
        onPlanetSelect={onPlanetSelect}
        onSatelliteSelect={onSatelliteSelect}
        selectedPlanetId={selectedPlanetId}
        accountName={accountName}
        starTemperature={starTemperature}
        starBrightness={starBrightness}
        isSupernova={isSupernova}
        planetAppearances={planetAppearances}
        satelliteAppearances={satelliteAppearances}
      />
    </Canvas>
  )
}
