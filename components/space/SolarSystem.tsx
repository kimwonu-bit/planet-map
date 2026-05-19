"use client"

import { useRef, useState, useCallback, useMemo, useEffect } from "react"
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
  commitFlashes?: Record<string, number>
}

function CameraController({ 
  targetRef, 
  selectedPlanetId 
}: { 
  targetRef: React.MutableRefObject<THREE.Vector3 | null>
  selectedPlanetId?: string | null 
}) {
  const { camera, controls } = useThree()
  const currentTarget = useRef(new THREE.Vector3(0, 0, 0))
  const prevSelectedId = useRef<string | null | undefined>(undefined)
  const isAutoZooming = useRef(false)
  const autoZoomDistance = useRef(60)
  
  useFrame(() => {
    const desiredTarget = targetRef.current || new THREE.Vector3(0, 0, 0)
    currentTarget.current.lerp(desiredTarget, 0.05)
    
    if (selectedPlanetId !== prevSelectedId.current) {
      prevSelectedId.current = selectedPlanetId
      isAutoZooming.current = true
      autoZoomDistance.current = selectedPlanetId ? 8 : 60
    }
    
    if (controls) {
      if (isAutoZooming.current) {
        const offset = camera.position.clone().sub(currentTarget.current)
        const currentDist = offset.length()
        // Prevent extremely small distances from causing glitches
        if (currentDist > 0.1) {
          const newDist = THREE.MathUtils.lerp(currentDist, autoZoomDistance.current, 0.05)
          offset.normalize().multiplyScalar(newDist)
          camera.position.copy(currentTarget.current).add(offset)
          
          if (Math.abs(currentDist - autoZoomDistance.current) < 0.1) {
            isAutoZooming.current = false
          }
        }
      }

      // @ts-ignore
      controls.target.copy(currentTarget.current)
      // @ts-ignore
      controls.update()
    } else {
      camera.lookAt(currentTarget.current)
    }
  })
  
  return null
}

interface OrbitingPlanetProps {
  planet: PlanetData
  onClick?: (planet: PlanetData) => void
  onSatelliteClick?: (planet: PlanetData, satellite: SatelliteData) => void
  isSelected?: boolean
  appearance?: PlanetAppearance
  satelliteAppearances?: Record<string, SatelliteAppearance>
  commitFlash?: number
  isTracking?: boolean
  trackingRef?: React.MutableRefObject<THREE.Vector3 | null>
}

function OrbitingPlanet({
  planet,
  onClick,
  onSatelliteClick,
  isSelected,
  appearance,
  satelliteAppearances,
  commitFlash = 0,
  isTracking,
  trackingRef,
}: OrbitingPlanetProps) {
  const groupRef = useRef<THREE.Group>(null)
  const orbitRadius = planet.orbitRadius ?? 8
  const orbitSpeed = planet.orbitSpeed ?? 0.1
  const orbitTilt = planet.orbitTilt ?? 0
  const isRoadmap = planet.isRoadmap ?? false

  const orbitRingGeometry = useMemo(() => {
    const points: THREE.Vector3[] = []
    const segments = 128
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2
      points.push(new THREE.Vector3(
        Math.cos(angle) * orbitRadius,
        0,
        Math.sin(angle) * orbitRadius,
      ))
    }
    return new THREE.BufferGeometry().setFromPoints(points)
  }, [orbitRadius])

  const dashedOrbitGeometry = useMemo(() => {
    if (!isRoadmap) return null
    const points: THREE.Vector3[] = []
    const segments = 128
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2
      points.push(new THREE.Vector3(
        Math.cos(angle) * orbitRadius,
        0,
        Math.sin(angle) * orbitRadius,
      ))
    }
    const geom = new THREE.BufferGeometry().setFromPoints(points)
    geom.computeBoundingSphere()
    return geom
  }, [orbitRadius, isRoadmap])

  const initialAngle = useMemo(() => Math.random() * Math.PI * 2, [])

  useFrame((state) => {
    if (!groupRef.current) return
    const time = state.clock.elapsedTime * orbitSpeed + initialAngle
    groupRef.current.position.x = Math.cos(time) * orbitRadius
    groupRef.current.position.z = Math.sin(time) * orbitRadius
    groupRef.current.position.y = Math.sin(time * 0.5) * 0.2

    if (isTracking && trackingRef) {
      const worldPos = new THREE.Vector3()
      groupRef.current.getWorldPosition(worldPos)
      trackingRef.current = worldPos
    }
  })

  const orbitColor = isRoadmap ? "#ffffff" : (appearance?.glowColor ?? "#888888")
  const orbitOpacity = isRoadmap ? 0.06 : 0.12

  return (
    <group rotation={[orbitTilt, 0, 0]}>
      {/* Orbit ring */}
      <line>
        <primitive object={orbitRingGeometry} />
        <lineBasicMaterial
          color={orbitColor}
          transparent
          opacity={orbitOpacity}
        />
      </line>

      {/* Dashed roadmap orbit indicator */}
      {isRoadmap && dashedOrbitGeometry && (
        <line>
          <primitive object={dashedOrbitGeometry} />
          <lineDashedMaterial
            color={orbitColor}
            transparent
            opacity={0.12}
            dashSize={0.5}
            gapSize={0.8}
          />
        </line>
      )}

      {/* Orbiting planet */}
      <group ref={groupRef}>
        <Planet
          data={planet}
          onClick={onClick}
          onSatelliteClick={onSatelliteClick}
          isSelected={isSelected}
          appearance={appearance}
          satelliteAppearances={satelliteAppearances}
          commitFlash={commitFlash}
        />
      </group>
    </group>
  )
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
  commitFlashes,
}: SolarSystemProps) {
  const trackingRef = useRef<THREE.Vector3 | null>(null)
  const starRef = useRef<THREE.Mesh>(null)

  useEffect(() => {
    if (!selectedPlanetId) {
      trackingRef.current = null
    }
  }, [selectedPlanetId])

  const starCoreColor = starTemperature >= 6200 ? "#f4f7ff" : starTemperature >= 5000 ? "#fff3c4" : "#ffb36b"
  const starGlowColor = isSupernova ? "#93c5fd" : starTemperature >= 5000 ? "#fde68a" : "#fb923c"
  const coreSize = isSupernova ? 4.5 : (1.55 + starBrightness * 0.35) * 2
  const glowSize = isSupernova ? 6.8 : coreSize * 1.55

  const handlePlanetClick = useCallback((planet: PlanetData) => {
    onPlanetSelect?.(planet)
  }, [onPlanetSelect])

  const handleBackgroundClick = useCallback(() => {
    onPlanetSelect?.(null)
    trackingRef.current = null
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
      <CameraController targetRef={trackingRef} selectedPlanetId={selectedPlanetId} />
      
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

      {/* Orbit rings + Orbiting Planets */}
      {planets.map((planet) => (
        <OrbitingPlanet
          key={planet.id}
          planet={planet}
          onClick={handlePlanetClick}
          onSatelliteClick={onSatelliteSelect}
          isSelected={selectedPlanetId === planet.id}
          appearance={planetAppearances?.[planet.id]}
          satelliteAppearances={satelliteAppearances?.[planet.id]}
          commitFlash={commitFlashes?.[planet.id] ?? 0}
          isTracking={selectedPlanetId === planet.id}
          trackingRef={trackingRef}
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
  commitFlashes,
}: SolarSystemProps) {
  return (
    <Canvas
      style={{ background: "transparent" }}
      gl={{ antialias: true, alpha: true }}
      dpr={[1, 1.5]}
    >
      <PerspectiveCamera makeDefault position={[0, 24, 48]} fov={52} />
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={3}
        maxDistance={120}
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
        commitFlashes={commitFlashes}
      />
    </Canvas>
  )
}
