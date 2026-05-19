export interface OrbitConfig {
  orbitRadius: number
  orbitSpeed: number
  orbitTilt: number
}

export interface SatelliteOrbitConfig {
  orbitRadius: number
  orbitSpeed: number
  size: number
}

const BASE_ORBIT_RADIUS = 16
const ORBIT_STEP = 5

// Orbit speed decreases with distance (outer planets move slower), matching Kepler's law feel.
// speed = k / sqrt(radius)  — analogous to orbital mechanics
function orbitSpeedFromRadius(radius: number): number {
  return parseFloat((0.5 / Math.sqrt(radius)).toFixed(4))
}

// Deterministic tilt based on language index to avoid random re-renders
function deterministicTilt(index: number): number {
  const tilts = [0.05, -0.08, 0.12, -0.06, 0.15, -0.03, 0.09, -0.11, 0.07, -0.14]
  return tilts[index % tilts.length]
}

/**
 * Assigns non-overlapping orbits to languages sorted by commit count desc.
 * Returns configs in the same order as the input array.
 */
export function calculatePlanetOrbits(
  languages: Array<{ commitCount: number }>
): OrbitConfig[] {
  return languages.map((_, index) => {
    const radius = BASE_ORBIT_RADIUS + index * ORBIT_STEP
    return {
      orbitRadius: radius,
      orbitSpeed: orbitSpeedFromRadius(radius),
      orbitTilt: deterministicTilt(index),
    }
  })
}

/**
 * Assigns satellite orbits around their parent planet.
 * Satellites spread outward from the planet surface, with inner ones moving faster.
 */
export function calculateSatelliteOrbits(
  satelliteCount: number
): SatelliteOrbitConfig[] {
  const configs: SatelliteOrbitConfig[] = []
  for (let i = 0; i < satelliteCount; i++) {
    const baseRadius = 1.0 + i * 0.6
    // Add a small deterministic variation so satellites don't stack at perfect intervals
    const variation = [0, 0.05, -0.05, 0.1, -0.1][i % 5]
    const radius = parseFloat((baseRadius + variation).toFixed(2))
    const speed = parseFloat((0.45 - i * 0.05).toFixed(2))
    const size = parseFloat((0.85 - i * 0.07).toFixed(2))

    configs.push({ orbitRadius: Math.max(1.0, radius), orbitSpeed: Math.max(0.15, speed), size: Math.max(0.3, size) })
  }
  return configs
}
