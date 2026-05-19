"use client"

import { useRef, useMemo } from "react"
import { useFrame } from "@react-three/fiber"
import type { ThreeEvent } from "@react-three/fiber"
import { Sphere, Html } from "@react-three/drei"
import * as THREE from "three"
import type { Mesh, Group } from "three"
import { Satellite } from "./Satellite"
import type { PlanetAppearance, SatelliteAppearance } from "./appearance"

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

export interface PlanetData {
  id: string
  name: string
  type: "javascript" | "typescript" | "python" | "java" | "go" | "rust" | "other"
  level: number
  brightness: number
  satellites: SatelliteData[]
  position: [number, number, number]
  orbitRadius?: number
  orbitSpeed?: number
  orbitTilt?: number
  commits?: number
  dailyCommits?: number
  isActiveToday?: boolean
  isRoadmap?: boolean
  description?: string
  learningRecommendation?: string
}

const planetColors: Record<string, { base: string; glow: string; surface: string }> = {
  javascript: { base: "#3f3510", glow: "#f7df1e", surface: "#6b5a15" },
  typescript: { base: "#102d4f", glow: "#3178c6", surface: "#1d4f86" },
  python: { base: "#1c3554", glow: "#ffd43b", surface: "#306998" },
  java: { base: "#4a1f16", glow: "#f89820", surface: "#7a2d1f" },
  go: { base: "#123b45", glow: "#00add8", surface: "#1a6f80" },
  rust: { base: "#2f241f", glow: "#dea584", surface: "#5a3b2e" },
  other: { base: "#2d2a4a", glow: "#a78bfa", surface: "#453f77" },
}

interface PlanetProps {
  data: PlanetData
  onClick?: (data: PlanetData) => void
  onSatelliteClick?: (planet: PlanetData, satellite: SatelliteData) => void
  isSelected?: boolean
  appearance?: PlanetAppearance
  satelliteAppearances?: Record<string, SatelliteAppearance>
  commitFlash?: number
}

export function Planet({
  data,
  onClick,
  onSatelliteClick,
  isSelected,
  appearance,
  satelliteAppearances,
  commitFlash = 0,
}: PlanetProps) {
  const groupRef = useRef<Group>(null)
  const planetRef = useRef<Mesh>(null)
  const atmosphereRef = useRef<Mesh>(null)

  const defaultColors = planetColors[data.type]
  const colors = {
    base: appearance?.baseColor ?? defaultColors.base,
    glow: appearance?.glowColor ?? defaultColors.glow,
    surface: appearance?.surfaceColor ?? defaultColors.surface,
  }
  const baseSize = (1.2 + data.level * 0.15) * (appearance?.scale ?? 1) * 0.8
  const activityBoost = data.isActiveToday ? 0.2 : 0
  const roadmapDim = data.isRoadmap ? 0.3 : 1

  // Create procedural planet texture
  const planetTexture = useMemo(() => {
    const canvas = document.createElement("canvas")
    canvas.width = 512
    canvas.height = 512
    const ctx = canvas.getContext("2d")
    if (!ctx) return null

    const style = appearance?.surfaceStyle ?? "rocky"
    const baseGradient = ctx.createLinearGradient(0, 0, 512, 512)
    baseGradient.addColorStop(0, colors.base)
    baseGradient.addColorStop(0.55, colors.surface)
    baseGradient.addColorStop(1, colors.base)
    ctx.fillStyle = baseGradient
    ctx.fillRect(0, 0, 512, 512)

    if (style === "gas") {
      for (let i = 0; i < 18; i++) {
        ctx.globalAlpha = 0.08 + (i % 3) * 0.03
        ctx.fillStyle = i % 2 === 0 ? colors.glow : colors.surface
        ctx.beginPath()
        ctx.ellipse(256, 32 + i * 28, 300, 10 + (i % 4) * 7, 0, 0, Math.PI * 2)
        ctx.fill()
      }
    } else if (style === "ocean") {
      ctx.globalAlpha = 0.32
      ctx.fillStyle = colors.surface
      for (let i = 0; i < 18; i++) {
        const x = (i * 89) % 512
        const y = (i * 137) % 512
        ctx.beginPath()
        ctx.ellipse(x, y, 55 + (i % 5) * 18, 28 + (i % 4) * 12, i * 0.7, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 0.14
      ctx.strokeStyle = "#ffffff"
      ctx.lineWidth = 2
      for (let i = 0; i < 10; i++) {
        ctx.beginPath()
        ctx.moveTo(0, i * 52)
        ctx.bezierCurveTo(160, i * 52 + 28, 300, i * 52 - 26, 512, i * 52 + 16)
        ctx.stroke()
      }
    } else if (style === "lava") {
      ctx.globalAlpha = 0.48
      ctx.strokeStyle = colors.glow
      ctx.lineWidth = 5
      for (let i = 0; i < 14; i++) {
        const y = (i * 43) % 512
        ctx.beginPath()
        ctx.moveTo((i * 31) % 90, y)
        ctx.bezierCurveTo(120, y + 80, 270, y - 80, 512, y + 30)
        ctx.stroke()
      }
    } else if (style === "ice") {
      ctx.globalAlpha = 0.28
      ctx.strokeStyle = "#e0f2fe"
      ctx.lineWidth = 2
      for (let i = 0; i < 32; i++) {
        const x = (i * 67) % 512
        const y = (i * 97) % 512
        ctx.beginPath()
        ctx.moveTo(x, y)
        ctx.lineTo((x + 90 + i * 11) % 512, (y + 45 + i * 7) % 512)
        ctx.stroke()
      }
    } else {
      ctx.globalAlpha = 0.18
      for (let i = 0; i < 120; i++) {
        const x = (i * 73) % 512
        const y = (i * 109) % 512
        const r = 5 + (i % 9) * 4
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, r)
        gradient.addColorStop(0, colors.surface)
        gradient.addColorStop(1, "transparent")
        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(x, y, r, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    ctx.globalAlpha = 0.16
    const shade = ctx.createRadialGradient(170, 160, 40, 256, 256, 370)
    shade.addColorStop(0, "rgba(255,255,255,0.35)")
    shade.addColorStop(0.55, "rgba(255,255,255,0)")
    shade.addColorStop(1, "rgba(0,0,0,0.55)")
    ctx.fillStyle = shade
    ctx.fillRect(0, 0, 512, 512)

    const texture = new THREE.CanvasTexture(canvas)
    texture.needsUpdate = true
    return texture
  }, [appearance?.surfaceStyle, colors.base, colors.glow, colors.surface])

  // Animation
  useFrame((state) => {
    if (planetRef.current) {
      planetRef.current.rotation.y += 0.001
      const pulse = data.isActiveToday
        ? 1 + Math.sin(state.clock.elapsedTime * 2.4) * 0.025
        : 1
      planetRef.current.scale.setScalar(pulse)
    }
    if (atmosphereRef.current) {
      atmosphereRef.current.rotation.y -= 0.0005
    }
  })

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    onClick?.(data)
  }

  return (
    <group ref={groupRef} position={data.position}>
      {/* Subtle outer glow */}
      <Sphere args={[baseSize * 1.4, 32, 32]} onClick={handleClick}>
        <meshBasicMaterial
          color={colors.glow}
          transparent
          opacity={(0.03 + activityBoost + (isSelected ? 0.05 : 0) + commitFlash * 0.15) * roadmapDim}
          side={THREE.BackSide}
        />
      </Sphere>

      {/* Atmosphere */}
      <Sphere ref={atmosphereRef} args={[baseSize * 1.08, 32, 32]}>
        <meshBasicMaterial
          color={colors.glow}
          transparent
          opacity={(0.05 + activityBoost * 0.5 + commitFlash * 0.12) * roadmapDim}
          side={THREE.BackSide}
        />
      </Sphere>

      {/* Main planet */}
      <Sphere ref={planetRef} args={[baseSize, 64, 64]} onClick={handleClick}>
        {planetTexture ? (
          <meshStandardMaterial
            map={planetTexture}
            emissive={colors.glow}
            emissiveIntensity={(0.1 + data.brightness * 0.18 + activityBoost + commitFlash * 0.5) * roadmapDim}
            transparent={data.isRoadmap}
            opacity={data.isRoadmap ? 0.58 : 1}
            roughness={0.9}
            metalness={0.1}
          />
        ) : (
          <meshStandardMaterial
            color={colors.base}
            emissive={colors.glow}
            emissiveIntensity={(0.1 + activityBoost + commitFlash * 0.5) * roadmapDim}
            transparent={data.isRoadmap}
            opacity={data.isRoadmap ? 0.58 : 1}
            roughness={0.9}
            metalness={0.1}
          />
        )}
      </Sphere>

      {/* Selection indicator - subtle ring */}
      {isSelected && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[baseSize * 1.5, baseSize * 1.55, 64]} />
          <meshBasicMaterial color={colors.glow} transparent opacity={0.4} side={THREE.DoubleSide} />
        </mesh>
      )}

      {data.isRoadmap && (
        <>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[baseSize * 1.72, baseSize * 1.78, 6]} />
            <meshBasicMaterial color={colors.glow} transparent opacity={0.18} side={THREE.DoubleSide} />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[baseSize * 1.88, baseSize * 1.92, 6]} />
            <meshBasicMaterial color={colors.glow} transparent opacity={0.1} side={THREE.DoubleSide} />
          </mesh>
        </>
      )}

      {appearance?.hasRings && (
        <mesh rotation={[Math.PI / 2.5, 0.3, 0.15]}>
          <ringGeometry args={[baseSize * 1.55, baseSize * 2.15, 96]} />
          <meshBasicMaterial color={colors.surface} transparent opacity={0.34} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* Planet label */}
      <Html
        position={[0, baseSize + 0.6, 0]}
        center
        distanceFactor={10}
        style={{ pointerEvents: "none", userSelect: "none" }}
      >
        <div className="flex flex-col items-center gap-0.5">
          <span className={`text-xs font-medium px-2 py-0.5 rounded backdrop-blur-sm whitespace-nowrap ${
            data.isRoadmap
              ? "text-foreground/40 bg-background/30 border border-dashed border-foreground/15"
              : "text-foreground/80 bg-background/60"
          }`}>
            {data.name}
          </span>
          <span className={`text-[10px] ${
            data.isRoadmap ? "text-muted-foreground/40" : "text-muted-foreground/60"
          }`}>
            {data.isRoadmap ? "🔭 미개척지" : `Lv.${data.level}`}
          </span>
        </div>
      </Html>

      {/* Satellites */}
      {data.satellites.map((satellite, index) => (
        <Satellite
          key={satellite.id}
          data={satellite}
          planetSize={baseSize}
          index={index}
          appearance={satelliteAppearances?.[satellite.id]}
          onClick={(clickedSatellite) => onSatelliteClick?.(data, clickedSatellite)}
        />
      ))}
    </group>
  )
}
