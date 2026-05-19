export type PlanetSurfaceStyle = "rocky" | "ocean" | "lava" | "ice" | "gas"

export interface PlanetAppearance {
  baseColor: string
  surfaceColor: string
  glowColor: string
  surfaceStyle: PlanetSurfaceStyle
  hasRings: boolean
  scale: number
  brightness: number  // 0 = 완전 어둠, 1 = 기본, 2 = 최대 발광
}

export type SatelliteShape = "sphere" | "cube" | "crystal"

export interface SatelliteAppearance {
  color: string
  glowColor: string
  shape: SatelliteShape
  scale: number
}

export type AppearanceTarget =
  | { kind: "planet"; id: string; name: string }
  | { kind: "satellite"; planetId: string; id: string; name: string }

