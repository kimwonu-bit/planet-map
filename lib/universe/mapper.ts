import type { PlanetData, SatelliteData } from "@/components/space/Planet"
import type { FrameworkMeta } from "@/lib/universe/frameworks"
import { calculatePlanetOrbits, calculateSatelliteOrbits } from "@/lib/universe/orbit"

type PlanetType = PlanetData["type"]

const LANGUAGE_TYPE_MAP: Record<string, PlanetType> = {
  JavaScript: "javascript",
  TypeScript: "typescript",
  Python: "python",
  Java: "java",
  Kotlin: "java",
  Go: "go",
  Rust: "rust",
  "C++": "other",
  "C#": "other",
  C: "other",
  Ruby: "other",
  PHP: "other",
  Swift: "other",
  Scala: "other",
  Dart: "other",
  Elixir: "other",
  Haskell: "other",
  Lua: "other",
  R: "other",
}

// 마크업·스타일·설정·데이터 언어 — 행성 제외
const NON_PROGRAMMING_LANGUAGES = new Set([
  "HTML", "CSS", "SCSS", "Sass", "Less",
  "Markdown", "MDX", "reStructuredText",
  "Shell", "Bash", "Batchfile", "PowerShell",
  "Makefile", "Dockerfile", "HCL", "Nix",
  "JSON", "YAML", "TOML", "XML",
  "PLpgSQL", "TSQL", "PLSQL",
  "Jupyter Notebook",
])

function toPlanetType(lang: string): PlanetType {
  return LANGUAGE_TYPE_MAP[lang] ?? "other"
}

export function isProgrammingLanguage(lang: string): boolean {
  return !NON_PROGRAMMING_LANGUAGES.has(lang)
}

function calculateLevel(commits: number, maxCommits: number): number {
  if (maxCommits === 0) return 1
  const ratio = commits / maxCommits
  if (ratio >= 0.55) return 5
  if (ratio >= 0.30) return 4
  if (ratio >= 0.12) return 3
  if (ratio >= 0.04) return 2
  return 1
}

function calculateBrightness(commits: number, maxCommits: number): number {
  if (maxCommits === 0) return 0.1
  // Power curve so small contributors still get visible brightness
  return parseFloat(Math.min(0.95, Math.pow(commits / maxCommits, 0.55)).toFixed(3))
}

export interface MappedPlanet extends Omit<PlanetData, "position"> {
  position: [number, number, number]
}

export function mapToPlanets(
  commitsByLanguage: Record<string, number>,
  frameworksByLang: Record<string, FrameworkMeta[]>,
  todayCommitsByLanguage: Record<string, number>,
  roadmapLanguageId: string | null,
  llmDescriptions: Record<string, { description: string; learningRecommendation: string }>
): PlanetData[] {
  const entries = Object.entries(commitsByLanguage)
    .filter(([lang, count]) => count > 0 && isProgrammingLanguage(lang))
    .sort((a, b) => b[1] - a[1])

  if (entries.length === 0) return []

  const maxCommits = entries[0][1]
  const orbits = calculatePlanetOrbits(entries.map(([, c]) => ({ commitCount: c })))

  const planets: PlanetData[] = entries.map(([langName, commits], index) => {
    const langId = langName.toLowerCase().replace(/\s+/g, "-")
    const planetType = toPlanetType(langName)
    const orbit = orbits[index]
    const dailyCommits = todayCommitsByLanguage[langName] ?? 0
    const llm = llmDescriptions[langId] ?? {}
    const frameworks = frameworksByLang[langId] ?? frameworksByLang[langName] ?? []

    const satellites = buildSatellites(frameworks, langId)

    return {
      id: langId,
      name: langName,
      type: planetType,
      level: calculateLevel(commits, maxCommits),
      brightness: calculateBrightness(commits, maxCommits),
      position: [0, 0, 0],
      orbitRadius: orbit.orbitRadius,
      orbitSpeed: orbit.orbitSpeed,
      orbitTilt: orbit.orbitTilt,
      commits,
      dailyCommits,
      isActiveToday: dailyCommits > 0,
      isRoadmap: false,
      description: llm.description,
      learningRecommendation: llm.learningRecommendation,
      satellites,
    }
  })

  // Attach roadmap planet if provided
  if (roadmapLanguageId) {
    const roadmapIndex = planets.length
    const roadmapOrbit = calculatePlanetOrbits([...entries, ["roadmap", 0]].map(([, c]) => ({ commitCount: c as number })))[roadmapIndex]
    const roadmapLangName = capitaliseLanguageId(roadmapLanguageId)
    const llm = llmDescriptions[roadmapLanguageId] ?? {}

    planets.push({
      id: roadmapLanguageId,
      name: roadmapLangName,
      type: toPlanetType(roadmapLangName),
      level: 0,
      brightness: 0.1,
      position: [0, 0, 0],
      orbitRadius: roadmapOrbit.orbitRadius,
      orbitSpeed: roadmapOrbit.orbitSpeed,
      orbitTilt: roadmapOrbit.orbitTilt,
      commits: 0,
      dailyCommits: 0,
      isActiveToday: false,
      isRoadmap: true,
      description: llm.description ?? `${roadmapLangName}은(는) 아직 개척하지 않은 새로운 언어입니다.`,
      learningRecommendation: llm.learningRecommendation ?? `공식 문서부터 시작하는 것을 추천합니다.`,
      satellites: buildRoadmapSatellites(roadmapLanguageId),
    })
  }

  return planets
}

function buildSatellites(frameworks: FrameworkMeta[], parentLangId: string): SatelliteData[] {
  const orbits = calculateSatelliteOrbits(frameworks.length)
  return frameworks.map((meta, i) => ({
    id: meta.id,
    name: meta.name,
    level: 2,
    color: meta.color,
    orbitRadius: orbits[i].orbitRadius,
    orbitSpeed: orbits[i].orbitSpeed,
    size: orbits[i].size,
    isPlanned: false,
  }))
}

// Returns "planned" satellites for the roadmap planet based on well-known ecosystem
function buildRoadmapSatellites(langId: string): SatelliteData[] {
  const roadmapEcosystems: Record<string, SatelliteData[]> = {
    rust:       [
      { id: "actix",  name: "Actix-web", level: 0, color: "#dea584", orbitRadius: 1.0, orbitSpeed: 0.35, size: 0.4, isPlanned: true },
      { id: "tokio",  name: "Tokio",     level: 0, color: "#5e81ac", orbitRadius: 1.6, orbitSpeed: 0.3,  size: 0.4, isPlanned: true },
      { id: "tauri",  name: "Tauri",     level: 0, color: "#ffc131", orbitRadius: 2.2, orbitSpeed: 0.25, size: 0.35,isPlanned: true },
    ],
    go:         [
      { id: "gin",    name: "Gin",       level: 0, color: "#00add8", orbitRadius: 1.0, orbitSpeed: 0.4,  size: 0.45, isPlanned: true },
      { id: "grpc",   name: "gRPC",      level: 0, color: "#4285f4", orbitRadius: 1.6, orbitSpeed: 0.35, size: 0.4,  isPlanned: true },
    ],
    python:     [
      { id: "fastapi",name: "FastAPI",   level: 0, color: "#009688", orbitRadius: 1.0, orbitSpeed: 0.45, size: 0.5,  isPlanned: true },
      { id: "pandas", name: "Pandas",    level: 0, color: "#150458", orbitRadius: 1.6, orbitSpeed: 0.35, size: 0.4,  isPlanned: true },
    ],
    kotlin:     [
      { id: "ktor",   name: "Ktor",      level: 0, color: "#7f52ff", orbitRadius: 1.0, orbitSpeed: 0.4,  size: 0.45, isPlanned: true },
    ],
  }
  return roadmapEcosystems[langId] ?? []
}

function capitaliseLanguageId(id: string): string {
  const nameMap: Record<string, string> = {
    javascript: "JavaScript",
    typescript: "TypeScript",
    python: "Python",
    java: "Java",
    go: "Go",
    rust: "Rust",
    kotlin: "Kotlin",
    swift: "Swift",
    "c++": "C++",
    "c#": "C#",
    ruby: "Ruby",
    php: "PHP",
  }
  return nameMap[id] ?? id.charAt(0).toUpperCase() + id.slice(1)
}
