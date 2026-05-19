"use client"

import { useMemo, useState, Suspense } from "react"
import dynamic from "next/dynamic"
import { UniverseHeader } from "@/components/ui/UniverseHeader"
import { PlanetDetailPanel } from "@/components/ui/PlanetDetailPanel"
import { AppearancePanel } from "@/components/ui/AppearancePanel"
import { Flame, Loader2, Info, Sparkles } from "lucide-react"
import type {
  AppearanceTarget,
  PlanetAppearance,
  PlanetData,
  SatelliteAppearance,
  SatelliteData,
} from "@/components/space"

const SolarSystem = dynamic(
  () => import("@/components/space").then((mod) => mod.SolarSystem),
  {
    ssr: false,
    loading: () => (
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary/60" />
          <p className="text-sm text-muted-foreground">우주를 불러오는 중...</p>
        </div>
      </div>
    ),
  }
)

// Mock data - will be replaced with real GitHub data
const mockPlanets: PlanetData[] = [
  {
    id: "javascript",
    name: "JavaScript",
    type: "javascript",
    level: 4,
    brightness: 0.76,
    position: [7.4, 0.5, 4.2],
    commits: 847,
    dailyCommits: 4,
    isActiveToday: true,
    satellites: [
      { id: "react", name: "React", level: 4, color: "#61dafb", orbitRadius: 1, orbitSpeed: 0.4, size: 0.8 },
      { id: "nextjs", name: "Next.js", level: 3, color: "#888888", orbitRadius: 1.6, orbitSpeed: 0.35, size: 0.7 },
      { id: "vue", name: "Vue", level: 2, color: "#4fc08d", orbitRadius: 2.2, orbitSpeed: 0.3, size: 0.6 },
      { id: "express", name: "Express", level: 2, color: "#d7d7d7", orbitRadius: 2.8, orbitSpeed: 0.25, size: 0.55 },
    ],
  },
  {
    id: "typescript",
    name: "TypeScript",
    type: "typescript",
    level: 3,
    brightness: 0.62,
    position: [-6.8, 1.3, -4.4],
    commits: 523,
    dailyCommits: 2,
    isActiveToday: true,
    satellites: [
      { id: "nodejs", name: "Node.js", level: 3, color: "#339933", orbitRadius: 1, orbitSpeed: 0.4, size: 0.7 },
      { id: "nestjs", name: "NestJS", level: 2, color: "#e0234e", orbitRadius: 1.5, orbitSpeed: 0.35, size: 0.6 },
      { id: "prisma", name: "Prisma", level: 2, color: "#5a67d8", orbitRadius: 2, orbitSpeed: 0.3, size: 0.5 },
      { id: "zod", name: "Zod", level: 1, color: "#3e67b1", orbitRadius: 2.5, orbitSpeed: 0.25, size: 0.4, isPlanned: true },
    ],
  },
  {
    id: "python",
    name: "Python",
    type: "python",
    level: 2,
    brightness: 0.45,
    position: [4.4, -1.6, -7.4],
    commits: 234,
    dailyCommits: 0,
    satellites: [
      { id: "fastapi", name: "FastAPI", level: 2, color: "#009688", orbitRadius: 1, orbitSpeed: 0.45, size: 0.6 },
      { id: "django", name: "Django", level: 1, color: "#44b78b", orbitRadius: 1.6, orbitSpeed: 0.35, size: 0.5 },
      { id: "pandas", name: "Pandas", level: 1, color: "#150458", orbitRadius: 2.2, orbitSpeed: 0.3, size: 0.4, isPlanned: true },
    ],
  },
  {
    id: "go",
    name: "Go",
    type: "go",
    level: 2,
    brightness: 0.34,
    position: [-5, -0.8, 6.6],
    commits: 178,
    dailyCommits: 1,
    isActiveToday: true,
    satellites: [
      { id: "gin", name: "Gin", level: 2, color: "#00add8", orbitRadius: 1, orbitSpeed: 0.4, size: 0.6 },
      { id: "grpc", name: "gRPC", level: 1, color: "#4285f4", orbitRadius: 1.5, orbitSpeed: 0.35, size: 0.5 },
      { id: "cobra", name: "Cobra", level: 1, color: "#7dd3fc", orbitRadius: 2, orbitSpeed: 0.3, size: 0.45, isPlanned: true },
    ],
  },
  {
    id: "rust",
    name: "Rust",
    type: "rust",
    level: 0,
    brightness: 0.12,
    position: [0, 2.1, -10.2],
    commits: 0,
    dailyCommits: 0,
    isRoadmap: true,
    satellites: [
      { id: "actix", name: "Actix", level: 0, color: "#dea584", orbitRadius: 1, orbitSpeed: 0.35, size: 0.4, isPlanned: true },
      { id: "tauri", name: "Tauri", level: 0, color: "#ffc131", orbitRadius: 1.6, orbitSpeed: 0.3, size: 0.4, isPlanned: true },
      { id: "wasm", name: "Wasm", level: 0, color: "#654ff0", orbitRadius: 2.2, orbitSpeed: 0.25, size: 0.35, isPlanned: true },
    ],
  },
]

interface UniverseViewProps {
  username: string
  avatarUrl?: string
}

export function UniverseView({ username, avatarUrl }: UniverseViewProps) {
  const [selectedPlanet, setSelectedPlanet] = useState<PlanetData | null>(null)
  const [appearanceTarget, setAppearanceTarget] = useState<AppearanceTarget | null>(null)
  const [planetAppearances, setPlanetAppearances] = useState<Record<string, PlanetAppearance>>(
    () => Object.fromEntries(mockPlanets.map((planet) => [planet.id, getDefaultPlanetAppearance(planet)])),
  )
  const [satelliteAppearances, setSatelliteAppearances] = useState<Record<string, Record<string, SatelliteAppearance>>>(
    () =>
      Object.fromEntries(
        mockPlanets.map((planet) => [
          planet.id,
          Object.fromEntries(
            planet.satellites.map((satellite) => [
              satellite.id,
              getDefaultSatelliteAppearance(satellite),
            ]),
          ),
        ]),
      ),
  )

  const exploredPlanets = mockPlanets.filter((planet) => !planet.isRoadmap)
  const totalCommits = exploredPlanets.reduce((sum, p) => sum + (p.commits || 0), 0)
  const todayCommits = exploredPlanets.reduce((sum, p) => sum + (p.dailyCommits || 0), 0)
  const activeLanguages = exploredPlanets.filter((planet) => planet.isActiveToday)
  const roadmapPlanet = mockPlanets.find((planet) => planet.isRoadmap)
  const starStats = useMemo(() => {
    const commitStreakDays = 42
    const temperature = 3200 + todayCommits * 160 + commitStreakDays * 6
    const brightness = Math.min(1, 0.22 + todayCommits * 0.08 + commitStreakDays / 500)
    const daysUntilSupernova = 365 - (commitStreakDays % 365)

    return {
      commitStreakDays,
      temperature,
      brightness,
      daysUntilSupernova,
      isSupernova: commitStreakDays > 0 && commitStreakDays % 365 === 0,
    }
  }, [todayCommits])

  const selectedPlanetAppearance =
    appearanceTarget?.kind === "planet"
      ? planetAppearances[appearanceTarget.id]
      : undefined
  const selectedSatelliteAppearance =
    appearanceTarget?.kind === "satellite"
      ? satelliteAppearances[appearanceTarget.planetId]?.[appearanceTarget.id]
      : undefined

  const handlePlanetSelect = (planet: PlanetData | null) => {
    setSelectedPlanet(planet)
    if (!planet) {
      setAppearanceTarget(null)
      return
    }

    setAppearanceTarget({ kind: "planet", id: planet.id, name: planet.name })
  }

  const handleSatelliteSelect = (planet: PlanetData, satellite: SatelliteData) => {
    setSelectedPlanet(planet)
    setAppearanceTarget({
      kind: "satellite",
      planetId: planet.id,
      id: satellite.id,
      name: `${planet.name} / ${satellite.name}`,
    })
  }

  const updatePlanetAppearance = (appearance: PlanetAppearance) => {
    if (appearanceTarget?.kind !== "planet") return
    setPlanetAppearances((current) => ({
      ...current,
      [appearanceTarget.id]: appearance,
    }))
  }

  const updateSatelliteAppearance = (appearance: SatelliteAppearance) => {
    if (appearanceTarget?.kind !== "satellite") return
    setSatelliteAppearances((current) => ({
      ...current,
      [appearanceTarget.planetId]: {
        ...current[appearanceTarget.planetId],
        [appearanceTarget.id]: appearance,
      },
    }))
  }

  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-[#050510]" />

      {/* Header */}
      <UniverseHeader
        username={username}
        avatarUrl={avatarUrl}
        totalCommits={totalCommits}
        totalPlanets={exploredPlanets.length}
      />

      {/* 3D Canvas */}
      <div className="absolute inset-0 pt-14">
        <Suspense fallback={null}>
          <SolarSystem
            planets={mockPlanets}
            onPlanetSelect={handlePlanetSelect}
            onSatelliteSelect={handleSatelliteSelect}
            selectedPlanetId={selectedPlanet?.id}
            accountName={username}
            starTemperature={starStats.temperature}
            starBrightness={starStats.brightness}
            isSupernova={starStats.isSupernova}
            planetAppearances={planetAppearances}
            satelliteAppearances={satelliteAppearances}
          />
        </Suspense>
      </div>

      {/* Hint */}
      <div className="absolute left-4 top-20 z-10">
        <div className="flex items-center gap-2 px-3 py-2 bg-card/60 backdrop-blur-sm rounded-lg border border-border/30">
          <Info className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            행성이나 위성을 클릭하여 외형 변경
          </span>
        </div>
      </div>

      {/* Legend */}
      <div className="absolute left-4 bottom-4 z-10">
        <div className="p-3 bg-card/60 backdrop-blur-sm rounded-lg border border-border/30 space-y-2">
          <p className="text-xs font-medium text-foreground/80 mb-2">언어</p>
          <div className="flex flex-col gap-1.5">
            {mockPlanets.map((planet) => (
              <LegendItem
                key={planet.id}
                color={getPlanetColor(planet.type)}
                label={planet.name}
                isActive={planet.isActiveToday}
                isRoadmap={planet.isRoadmap}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Activity */}
      <div className="absolute right-4 top-20 z-10 w-64">
        <div className="p-3 bg-card/60 backdrop-blur-sm rounded-lg border border-border/30 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-3.5 h-3.5 text-orange-300" />
              <span className="text-xs font-medium text-foreground/80">항성 온도</span>
            </div>
            <span className="text-xs text-foreground">{starStats.temperature.toLocaleString()}K</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted/40 overflow-hidden">
            <div
              className="h-full rounded-full bg-orange-300"
              style={{ width: `${Math.round(starStats.brightness * 100)}%` }}
            />
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
            <span>오늘 커밋 {todayCommits}</span>
            <span>{starStats.commitStreakDays}일 연속</span>
          </div>
          {roadmapPlanet && (
            <div className="flex items-center gap-2 pt-2 border-t border-border/30">
              <Sparkles className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                다음 미개척지: {roadmapPlanet.name}
              </span>
            </div>
          )}
          <p className="text-[11px] text-muted-foreground">
            365일 연속 커밋 시 초신성 폭발
          </p>
        </div>
      </div>

      {/* Status */}
      <div className="absolute right-4 bottom-4 z-10">
        <div className="flex items-center gap-2 px-3 py-2 bg-card/60 backdrop-blur-sm rounded-lg border border-border/30">
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          <span className="text-xs text-muted-foreground">
            활성 언어 {activeLanguages.length}개
          </span>
        </div>
      </div>

      {/* Detail Panel */}
      <PlanetDetailPanel planet={selectedPlanet} onClose={() => setSelectedPlanet(null)} />
      <AppearancePanel
        target={appearanceTarget}
        planetAppearance={selectedPlanetAppearance}
        satelliteAppearance={selectedSatelliteAppearance}
        onUpdatePlanet={updatePlanetAppearance}
        onUpdateSatellite={updateSatelliteAppearance}
        onClose={() => setAppearanceTarget(null)}
      />
    </div>
  )
}

function LegendItem({
  color,
  label,
  isActive,
  isRoadmap,
}: {
  color: string
  label: string
  isActive?: boolean
  isRoadmap?: boolean
}) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={`w-2 h-2 rounded-full ${isActive ? "animate-pulse" : ""}`}
        style={{ backgroundColor: color, opacity: isRoadmap ? 0.45 : 1 }}
      />
      <span className={`text-xs ${isRoadmap ? "text-muted-foreground/60" : "text-muted-foreground"}`}>
        {label}{isRoadmap ? " · 미개척" : isActive ? " · 오늘 활성" : ""}
      </span>
    </div>
  )
}

function getPlanetColor(type: PlanetData["type"]) {
  const colors: Record<PlanetData["type"], string> = {
    javascript: "#f7df1e",
    typescript: "#3178c6",
    python: "#ffd43b",
    java: "#f89820",
    go: "#00add8",
    rust: "#dea584",
    other: "#a78bfa",
  }

  return colors[type]
}

function getDefaultPlanetAppearance(planet: PlanetData): PlanetAppearance {
  const defaults: Record<PlanetData["type"], PlanetAppearance> = {
    javascript: {
      baseColor: "#3f3510",
      surfaceColor: "#8f7a1c",
      glowColor: "#f7df1e",
      surfaceStyle: "rocky",
      hasRings: false,
      scale: 1,
    },
    typescript: {
      baseColor: "#102d4f",
      surfaceColor: "#2563eb",
      glowColor: "#60a5fa",
      surfaceStyle: "ocean",
      hasRings: true,
      scale: 1,
    },
    python: {
      baseColor: "#1c3554",
      surfaceColor: "#306998",
      glowColor: "#ffd43b",
      surfaceStyle: "gas",
      hasRings: false,
      scale: 1,
    },
    java: {
      baseColor: "#4a1f16",
      surfaceColor: "#7a2d1f",
      glowColor: "#f89820",
      surfaceStyle: "lava",
      hasRings: false,
      scale: 1,
    },
    go: {
      baseColor: "#123b45",
      surfaceColor: "#1a6f80",
      glowColor: "#00add8",
      surfaceStyle: "ice",
      hasRings: false,
      scale: 1,
    },
    rust: {
      baseColor: "#2f241f",
      surfaceColor: "#6f4a37",
      glowColor: "#dea584",
      surfaceStyle: "rocky",
      hasRings: true,
      scale: 1,
    },
    other: {
      baseColor: "#2d2a4a",
      surfaceColor: "#453f77",
      glowColor: "#a78bfa",
      surfaceStyle: "gas",
      hasRings: false,
      scale: 1,
    },
  }

  return defaults[planet.type]
}

function getDefaultSatelliteAppearance(satellite: SatelliteData): SatelliteAppearance {
  return {
    color: satellite.color,
    glowColor: satellite.color,
    shape: satellite.isPlanned ? "crystal" : "sphere",
    scale: 1,
  }
}
