"use client"

import { useState } from "react"
import { PlanetData } from "@/components/space"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  X,
  GitCommit,
  Target,
  Rocket,
  Sparkles,
  Eye,
  Flame,
} from "lucide-react"

interface PlanetDetailPanelProps {
  planet: PlanetData | null
  onClose: () => void
}

const typeLabels: Record<string, { label: string; color: string }> = {
  javascript: { label: "언어", color: "#f7df1e" },
  typescript: { label: "언어", color: "#3178c6" },
  python: { label: "언어", color: "#ffd43b" },
  java: { label: "언어", color: "#f89820" },
  go: { label: "언어", color: "#00add8" },
  rust: { label: "미개척 언어", color: "#dea584" },
  other: { label: "언어", color: "#a78bfa" },
}

export function PlanetDetailPanel({ planet, onClose }: PlanetDetailPanelProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "satellites">("overview")

  if (!planet) return null

  const typeInfo = typeLabels[planet.type] || { label: planet.type, color: "#888" }
  const activeSatellites = planet.satellites.filter((s) => !s.isPlanned)
  const plannedSatellites = planet.satellites.filter((s) => s.isPlanned)

  return (
    <div className="absolute right-4 top-20 bottom-4 w-80 bg-card/80 backdrop-blur-xl border border-border/50 rounded-xl overflow-hidden flex flex-col z-10">
      {/* Header */}
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: typeInfo.color }}
            />
            <h2 className="font-semibold text-foreground">{planet.name}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-muted rounded-md transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {planet.isRoadmap ? "Roadmap" : `Lv.${planet.level}`}
          </Badge>
          {planet.isActiveToday && (
            <Badge variant="outline" className="text-xs">
              오늘 활성
            </Badge>
          )}
          <span className="text-xs text-muted-foreground">
            {typeInfo.label}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border/50 px-2">
        {[
          { id: "overview" as const, label: "개요" },
          { id: "satellites" as const, label: "기술 위성" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
              activeTab === tab.id
                ? "text-foreground border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === "overview" && (
          <div className="space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-2 gap-2">
              <StatCard
                icon={<GitCommit className="w-3.5 h-3.5" />}
                label="누적 커밋"
                value={(planet.commits || 0).toLocaleString()}
              />
              <StatCard
                icon={<Flame className="w-3.5 h-3.5" />}
                label="오늘 커밋"
                value={(planet.dailyCommits || 0).toLocaleString()}
              />
              <StatCard
                icon={<Sparkles className="w-3.5 h-3.5" />}
                label="기술"
                value={planet.satellites.length.toString()}
              />
              <StatCard
                icon={<Target className="w-3.5 h-3.5" />}
                label="사용 중"
                value={activeSatellites.length.toString()}
              />
              <StatCard
                icon={<Rocket className="w-3.5 h-3.5" />}
                label={planet.isRoadmap ? "개척 후보" : "관심"}
                value={plannedSatellites.length.toString()}
              />
            </div>

            {/* Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">
                  {planet.isRoadmap ? "개척 가능성" : "숙련도"}
                </span>
                <span className="text-foreground">{Math.round(planet.brightness * 100)}%</span>
              </div>
              <Progress value={planet.brightness * 100} className="h-1.5" />
            </div>

            {/* Read-only notice */}
            <div className="p-3 bg-muted/30 rounded-lg flex items-start gap-2">
              <Eye className="w-3.5 h-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                {planet.isRoadmap
                  ? "로드맵은 다음 행성입니다. 아직 커밋이 없어 어둡게 표시되는 미개척지입니다."
                  : "커밋에 사용된 언어 행성은 밝아지고, 오늘 커밋한 언어는 활성 상태로 표시됩니다."}
              </p>
            </div>

            {/* Language Description & Learning Recommendation */}
            {(planet.description || planet.learningRecommendation) && (
              <div className="space-y-3 pt-3 border-t border-border/50">
                {planet.description && (
                  <div>
                    <h3 className="text-[11px] font-medium text-foreground mb-1">언어 설명</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {planet.description}
                    </p>
                  </div>
                )}
                {planet.learningRecommendation && (
                  <div>
                    <h3 className="text-[11px] font-medium text-foreground mb-1 flex items-center gap-1.5">
                      <Rocket className="w-3 h-3 text-primary" />
                      학습 방법 추천
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {planet.learningRecommendation}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === "satellites" && (
          <div className="space-y-4">
            {activeSatellites.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-medium text-foreground flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-primary" />
                  사용 중 ({activeSatellites.length})
                </h3>
                <div className="space-y-1.5">
                  {activeSatellites.map((satellite) => (
                    <SatelliteCard key={satellite.id} satellite={satellite} />
                  ))}
                </div>
              </div>
            )}

            {plannedSatellites.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-medium text-foreground flex items-center gap-1.5">
                  <Rocket className="w-3 h-3 text-muted-foreground" />
                  관심 기술 ({plannedSatellites.length})
                </h3>
                <div className="space-y-1.5">
                  {plannedSatellites.map((satellite) => (
                    <SatelliteCard key={satellite.id} satellite={satellite} isPlanned />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="p-2.5 bg-muted/30 rounded-lg">
      <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
        {icon}
        <span className="text-[10px]">{label}</span>
      </div>
      <p className="text-sm font-semibold text-foreground">{value}</p>
    </div>
  )
}

function SatelliteCard({
  satellite,
  isPlanned,
}: {
  satellite: { id: string; name: string; level: number; color: string }
  isPlanned?: boolean
}) {
  return (
    <div
      className={`p-2.5 rounded-lg border ${
        isPlanned
          ? "bg-muted/20 border-dashed border-border/50"
          : "bg-muted/30 border-border/30"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${isPlanned ? "opacity-40" : ""}`}
            style={{ backgroundColor: satellite.color }}
          />
          <span className={`text-xs ${isPlanned ? "text-muted-foreground" : "text-foreground"}`}>
            {satellite.name}
          </span>
        </div>
        {!isPlanned && (
          <span className="text-[10px] text-muted-foreground">
            L{satellite.level}
          </span>
        )}
      </div>
    </div>
  )
}
