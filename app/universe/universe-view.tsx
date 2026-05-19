"use client"

import { useMemo, useState, useEffect, useRef, Suspense } from "react"
import dynamic from "next/dynamic"
import { UniverseHeader } from "@/components/ui/UniverseHeader"
import { PlanetDetailPanel } from "@/components/ui/PlanetDetailPanel"
import { AppearancePanel } from "@/components/ui/AppearancePanel"
import { Flame, Loader2, Info, Sparkles, Rocket } from "lucide-react"
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

interface UniverseViewProps {
  username: string
  avatarUrl?: string
}

export function UniverseView({ username, avatarUrl }: UniverseViewProps) {
  const [planets, setPlanets] = useState<PlanetData[]>([])
  const [isLoadingUniverse, setIsLoadingUniverse] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [universeStats, setUniverseStats] = useState({
    totalCommits: 0,
    todayCommits: 0,
    commitStreakDays: 0,
  })
  const [selectedPlanet, setSelectedPlanet] = useState<PlanetData | null>(null)
  const [commitFlashes] = useState<Record<string, number>>({})
  const flashTimers = useRef<Record<string, ReturnType<typeof setInterval>>>({})
  const [appearanceTarget, setAppearanceTarget] = useState<AppearanceTarget | null>(null)
  const [planetAppearances, setPlanetAppearances] = useState<Record<string, PlanetAppearance>>({})
  const [satelliteAppearances, setSatelliteAppearances] = useState<Record<string, Record<string, SatelliteAppearance>>>({})

  const [retryCount, setRetryCount] = useState(0)

  // Fetch real universe data from backend
  useEffect(() => {
    if (!username) return
    setIsLoadingUniverse(true)
    setFetchError(null)
    fetch(`/api/users/${username}/universe`)
      .then(async (r) => {
        const data = await r.json()
        if (!r.ok) throw new Error(data.error ?? `HTTP ${r.status}`)
        return data
      })
      .then((data) => {
        if (!data.planets) throw new Error("응답 데이터 형식이 올바르지 않습니다.")
        setPlanets(data.planets)
        setUniverseStats({
          totalCommits: data.totalCommits ?? 0,
          todayCommits: data.todayCommits ?? 0,
          commitStreakDays: data.commitStreakDays ?? 0,
        })
        setPlanetAppearances(
          Object.fromEntries(data.planets.map((p: PlanetData) => [p.id, getDefaultPlanetAppearance(p)]))
        )
        setSatelliteAppearances(
          Object.fromEntries(
            data.planets.map((p: PlanetData) => [
              p.id,
              Object.fromEntries(p.satellites.map((s) => [s.id, getDefaultSatelliteAppearance(s)])),
            ])
          )
        )
      })
      .catch((err: Error) => setFetchError(err.message))
      .finally(() => setIsLoadingUniverse(false))
  }, [username, retryCount])

  useEffect(() => {
    return () => {
      Object.values(flashTimers.current).forEach(clearInterval)
    }
  }, [])

  const planetsWithRoadmap = useMemo(() => planets, [planets])

  const exploredPlanets = planetsWithRoadmap.filter((planet) => !planet.isRoadmap)
  const totalCommits = universeStats.totalCommits || exploredPlanets.reduce((sum, p) => sum + (p.commits || 0), 0)
  const todayCommits = universeStats.todayCommits
  const activeLanguages = exploredPlanets.filter((planet) => planet.isActiveToday)
  const roadmapPlanet = planetsWithRoadmap.find((planet) => planet.isRoadmap)
  const starStats = useMemo(() => {
    const commitStreakDays = universeStats.commitStreakDays
    const temperature = 2000 + todayCommits * 200
    const brightness = Math.min(1, 0.05 + todayCommits * 0.06)
    const daysUntilSupernova = 365 - (commitStreakDays % 365)

    return {
      commitStreakDays,
      temperature,
      brightness,
      daysUntilSupernova,
      isSupernova: commitStreakDays > 0 && commitStreakDays % 365 === 0,
    }
  }, [todayCommits, universeStats.commitStreakDays])

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

  if (isLoadingUniverse) {
    return (
      <div className="relative min-h-screen bg-background overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-[#050510]" />
        <div className="relative flex flex-col items-center gap-3 z-10">
          <Loader2 className="w-10 h-10 animate-spin text-primary/60" />
          <p className="text-sm text-muted-foreground">GitHub 우주를 생성하는 중...</p>
          <p className="text-xs text-muted-foreground/50">첫 방문 시 최대 30초 소요될 수 있습니다</p>
        </div>
      </div>
    )
  }

  if (fetchError) {
    return (
      <div className="relative min-h-screen bg-background overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-[#050510]" />
        <div className="relative flex flex-col items-center gap-4 z-10 max-w-md text-center px-6">
          <p className="text-4xl">🌑</p>
          <p className="text-base font-medium text-foreground">우주를 불러오지 못했습니다</p>
          <p className="text-sm text-muted-foreground break-all">{fetchError}</p>
          <button
            onClick={() => { setFetchError(null); setRetryCount((c) => c + 1) }}
            className="mt-2 px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            다시 시도
          </button>
        </div>
      </div>
    )
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
            planets={planetsWithRoadmap}
            onPlanetSelect={handlePlanetSelect}
            onSatelliteSelect={handleSatelliteSelect}
            selectedPlanetId={selectedPlanet?.id}
            accountName={username}
            starTemperature={starStats.temperature}
            starBrightness={starStats.brightness}
            isSupernova={starStats.isSupernova}
            planetAppearances={planetAppearances}
            satelliteAppearances={satelliteAppearances}
            commitFlashes={commitFlashes}
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
            {planetsWithRoadmap.map((planet) => (
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
            <div className="flex flex-col gap-2 pt-2 border-t border-border/30">
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  다음 미개척지: {roadmapPlanet.name}
                </span>
              </div>
              <button
                onClick={() => handlePlanetSelect(roadmapPlanet)}
                className="flex items-center justify-center gap-1.5 w-full py-1.5 mt-1 text-xs font-medium text-primary-foreground bg-primary/80 hover:bg-primary rounded-md transition-colors"
              >
                <Rocket className="w-3.5 h-3.5" />
                미개척지로 이동
              </button>
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
      brightness: 1,
    },
    typescript: {
      baseColor: "#102d4f",
      surfaceColor: "#2563eb",
      glowColor: "#60a5fa",
      surfaceStyle: "ocean",
      hasRings: true,
      scale: 1,
      brightness: 1,
    },
    python: {
      baseColor: "#1c3554",
      surfaceColor: "#306998",
      glowColor: "#ffd43b",
      surfaceStyle: "gas",
      hasRings: false,
      scale: 1,
      brightness: 1,
    },
    java: {
      baseColor: "#4a1f16",
      surfaceColor: "#7a2d1f",
      glowColor: "#f89820",
      surfaceStyle: "lava",
      hasRings: false,
      scale: 1,
      brightness: 1,
    },
    go: {
      baseColor: "#123b45",
      surfaceColor: "#1a6f80",
      glowColor: "#00add8",
      surfaceStyle: "ice",
      hasRings: false,
      scale: 1,
      brightness: 1,
    },
    rust: {
      baseColor: "#2f241f",
      surfaceColor: "#6f4a37",
      glowColor: "#dea584",
      surfaceStyle: "rocky",
      hasRings: true,
      scale: 1,
      brightness: 1,
    },
    other: {
      baseColor: "#2d2a4a",
      surfaceColor: "#453f77",
      glowColor: "#a78bfa",
      surfaceStyle: "gas",
      hasRings: false,
      scale: 1,
      brightness: 1,
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
