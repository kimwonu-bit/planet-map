"use client"

import { X } from "lucide-react"
import type {
  AppearanceTarget,
  PlanetAppearance,
  PlanetSurfaceStyle,
  SatelliteAppearance,
  SatelliteShape,
} from "@/components/space"

interface AppearancePanelProps {
  target: AppearanceTarget | null
  planetAppearance?: PlanetAppearance
  satelliteAppearance?: SatelliteAppearance
  onUpdatePlanet: (appearance: PlanetAppearance) => void
  onUpdateSatellite: (appearance: SatelliteAppearance) => void
  onClose: () => void
}

const planetPresets: Array<{ label: string; value: PlanetSurfaceStyle; colors: [string, string, string] }> = [
  { label: "암석", value: "rocky", colors: ["#3b2f2f", "#8b6f47", "#f59e0b"] },
  { label: "대양", value: "ocean", colors: ["#0f2f5f", "#1d9bd1", "#93c5fd"] },
  { label: "용암", value: "lava", colors: ["#220b0b", "#7f1d1d", "#fb923c"] },
  { label: "얼음", value: "ice", colors: ["#dbeafe", "#67e8f9", "#e0f2fe"] },
  { label: "가스", value: "gas", colors: ["#4338ca", "#f9a8d4", "#fde68a"] },
]

const satelliteShapes: Array<{ label: string; value: SatelliteShape }> = [
  { label: "구형", value: "sphere" },
  { label: "큐브", value: "cube" },
  { label: "결정", value: "crystal" },
]

export function AppearancePanel({
  target,
  planetAppearance,
  satelliteAppearance,
  onUpdatePlanet,
  onUpdateSatellite,
  onClose,
}: AppearancePanelProps) {
  if (!target) return null

  return (
    <div className="absolute left-4 top-32 z-20 w-72 bg-card/85 backdrop-blur-xl border border-border/50 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between p-3 border-b border-border/50">
        <div>
          <p className="text-sm font-medium text-foreground">{target.name}</p>
          <p className="text-[11px] text-muted-foreground">
            {target.kind === "planet" ? "행성 외형" : "위성 외형"}
          </p>
        </div>
        <button onClick={onClose} className="p-1.5 hover:bg-muted rounded-md transition-colors">
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {target.kind === "planet" && planetAppearance && (
        <div className="p-3 space-y-4">
          <div className="space-y-2">
            <p className="text-xs font-medium text-foreground/80">행성 타입</p>
            <div className="grid grid-cols-5 gap-1.5">
              {planetPresets.map((preset) => (
                <button
                  key={preset.value}
                  onClick={() =>
                    onUpdatePlanet({
                      ...planetAppearance,
                      surfaceStyle: preset.value,
                      baseColor: preset.colors[0],
                      surfaceColor: preset.colors[1],
                      glowColor: preset.colors[2],
                    })
                  }
                  className={`h-9 rounded-md border text-[10px] transition-colors ${
                    planetAppearance.surfaceStyle === preset.value
                      ? "border-primary text-foreground"
                      : "border-border/50 text-muted-foreground hover:text-foreground"
                  }`}
                  title={preset.label}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <ColorField
            label="기본색"
            value={planetAppearance.baseColor}
            onChange={(baseColor) => onUpdatePlanet({ ...planetAppearance, baseColor })}
          />
          <ColorField
            label="표면색"
            value={planetAppearance.surfaceColor}
            onChange={(surfaceColor) => onUpdatePlanet({ ...planetAppearance, surfaceColor })}
          />
          <ColorField
            label="발광색"
            value={planetAppearance.glowColor}
            onChange={(glowColor) => onUpdatePlanet({ ...planetAppearance, glowColor })}
          />

          <RangeField
            label="크기"
            value={planetAppearance.scale}
            min={0.75}
            max={1.1}
            step={0.05}
            onChange={(scale) => onUpdatePlanet({ ...planetAppearance, scale })}
          />

          <label className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2">
            <span className="text-xs text-foreground">고리 표시</span>
            <input
              type="checkbox"
              checked={planetAppearance.hasRings}
              onChange={(event) => onUpdatePlanet({ ...planetAppearance, hasRings: event.target.checked })}
            />
          </label>
        </div>
      )}

      {target.kind === "satellite" && satelliteAppearance && (
        <div className="p-3 space-y-4">
          <div className="space-y-2">
            <p className="text-xs font-medium text-foreground/80">위성 형태</p>
            <div className="grid grid-cols-3 gap-1.5">
              {satelliteShapes.map((shape) => (
                <button
                  key={shape.value}
                  onClick={() => onUpdateSatellite({ ...satelliteAppearance, shape: shape.value })}
                  className={`h-9 rounded-md border text-xs transition-colors ${
                    satelliteAppearance.shape === shape.value
                      ? "border-primary text-foreground"
                      : "border-border/50 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {shape.label}
                </button>
              ))}
            </div>
          </div>

          <ColorField
            label="표면색"
            value={satelliteAppearance.color}
            onChange={(color) => onUpdateSatellite({ ...satelliteAppearance, color })}
          />
          <ColorField
            label="발광색"
            value={satelliteAppearance.glowColor}
            onChange={(glowColor) => onUpdateSatellite({ ...satelliteAppearance, glowColor })}
          />
          <RangeField
            label="크기"
            value={satelliteAppearance.scale}
            min={0.7}
            max={1.2}
            step={0.05}
            onChange={(scale) => onUpdateSatellite({ ...satelliteAppearance, scale })}
          />
        </div>
      )}
    </div>
  )
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <label className="flex items-center justify-between gap-3">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-[11px] text-muted-foreground tabular-nums">{value}</span>
        <input
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-8 w-10 rounded border border-border bg-transparent"
        />
      </div>
    </label>
  )
}

function RangeField({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (value: number) => void
}) {
  return (
    <label className="space-y-2 block">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-[11px] text-muted-foreground">{value.toFixed(2)}x</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full"
      />
    </label>
  )
}
