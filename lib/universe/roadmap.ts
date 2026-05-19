import { generateRoadmapWithAI, type StackEntry } from "@/lib/ai/github-models"
import { buildStackFingerprint } from "@/lib/ai/stack-fingerprint"
import { getCachedRoadmap, setCachedRoadmap } from "@/lib/universe/cache"

// L1 인메모리 캐시 — Supabase 미설정 시에도 프로세스 재시작 전까지 재호출 방지
const memoryCache = new Map<string, PersonalizedRoadmap>()

export interface PlanetDescription {
  description: string
  learningRecommendation: string
}

export interface PersonalizedRoadmap {
  languageId: string
  languageName: string
  description: string          // reason을 description 형식으로 변환
  learningRecommendation: string  // learningPath 3단계를 합쳐 변환
  stackFingerprint: string
}

// 하드코딩 언어 설명 — 개인화 불필요, 0 토큰
const LANGUAGE_DESCRIPTIONS: Record<string, PlanetDescription> = {
  javascript: {
    description: "웹의 공용어. 브라우저와 Node.js 서버 모두에서 동작하며 가장 넓은 생태계를 가진 언어입니다.",
    learningRecommendation: "MDN 웹 문서로 기초를 다지고, javascript.info로 모던 JS를 익히세요. 이후 실제 프로젝트를 만들며 비동기 패턴을 마스터하는 것을 추천합니다.",
  },
  typescript: {
    description: "JavaScript에 정적 타입을 더한 언어로, 대규모 프로젝트에서 버그를 사전에 잡고 개발 생산성을 높입니다.",
    learningRecommendation: "공식 TypeScript Handbook을 정독하고 type-challenges 레포지토리로 타입 시스템을 깊이 익히세요.",
  },
  python: {
    description: "읽기 쉬운 문법과 방대한 생태계로 웹 백엔드, 데이터 분석, AI/ML, 자동화 등 모든 분야에서 활용되는 언어입니다.",
    learningRecommendation: "공식 튜토리얼로 시작해 FastAPI로 웹 개발을, Pandas로 데이터 분석을 경험해보세요.",
  },
  java: {
    description: "강한 타입 시스템과 방대한 엔터프라이즈 생태계를 가진 JVM의 대표 언어입니다.",
    learningRecommendation: "Spring Boot 공식 가이드로 시작해 JPA와 RESTful API 패턴을 익히세요.",
  },
  go: {
    description: "Google이 설계한 컴파일 언어로, 간결한 문법과 뛰어난 동시성 처리로 백엔드와 인프라 도구에 강점이 있습니다.",
    learningRecommendation: "go.dev/tour를 완주한 뒤 Effective Go를 읽고, 실제 CLI 도구나 API 서버를 만들어보세요.",
  },
  rust: {
    description: "메모리 안전성과 최고 수준의 성능을 동시에 보장하는 시스템 프로그래밍 언어입니다.",
    learningRecommendation: "'The Rust Programming Language' 공식 책을 정독하고 rustlings 연습 문제로 소유권 시스템을 익히세요.",
  },
  kotlin: {
    description: "Java의 장점을 유지하면서 현대적인 문법을 제공하는 JVM 언어로, Android 개발의 공식 언어입니다.",
    learningRecommendation: "Kotlin playground에서 시작해 코루틴을 학습하고 Ktor 프레임워크로 서버를 구현해보세요.",
  },
  swift: {
    description: "Apple 생태계의 공식 언어로, iOS·macOS 앱 개발에 특화되어 있습니다.",
    learningRecommendation: "Swift.org 공식 튜토리얼과 SwiftUI로 첫 iOS 앱을 만들어보세요.",
  },
  ruby: {
    description: "개발자 행복을 중시하는 언어로, Ruby on Rails 프레임워크를 통해 빠른 웹 개발이 가능합니다.",
    learningRecommendation: "The Odin Project 커리큘럼으로 Ruby 기초부터 Rails까지 체계적으로 학습하세요.",
  },
  php: {
    description: "웹의 오랜 동반자로, WordPress·Laravel 등의 생태계를 통해 전 세계 웹사이트의 상당수를 구동합니다.",
    learningRecommendation: "PHP8의 모던 문법을 익히고 Laravel 공식 문서로 풀스택 웹 개발을 경험해보세요.",
  },
}

function getFallbackDescription(langId: string, langName: string): PlanetDescription {
  return LANGUAGE_DESCRIPTIONS[langId] ?? {
    description: `${langName}은(는) 현재 활발히 사용 중인 언어입니다.`,
    learningRecommendation: "공식 문서와 커뮤니티 튜토리얼을 통해 심화 학습을 진행해보세요.",
  }
}

// 하드코딩 폴백 진행 경로 (Gemini 미설정 시)
const FALLBACK_PROGRESSION: Record<string, string[]> = {
  javascript: ["typescript", "python", "go"],
  typescript: ["go", "rust", "python"],
  python:     ["go", "rust", "java"],
  java:       ["kotlin", "go", "rust"],
  go:         ["rust", "python", "typescript"],
  rust:       ["go", "python", "typescript"],
}

function selectFallbackRoadmap(knownIds: string[]): { languageId: string; languageName: string } | null {
  const known = new Set(knownIds)
  const nameMap: Record<string, string> = {
    typescript: "TypeScript", python: "Python", go: "Go",
    rust: "Rust", java: "Java", kotlin: "Kotlin", javascript: "JavaScript",
  }
  for (const id of knownIds) {
    const next = (FALLBACK_PROGRESSION[id] ?? []).find((c) => !known.has(c))
    if (next) return { languageId: next, languageName: nameMap[next] ?? next }
  }
  const defaults = ["javascript", "typescript", "python", "go", "rust"]
  const next = defaults.find((l) => !known.has(l))
  return next ? { languageId: next, languageName: nameMap[next] ?? next } : null
}

/**
 * 언어별 설명 반환 (하드코딩 — 0 토큰)
 */
export function getLanguageDescriptions(
  languages: Array<{ id: string; name: string }>
): Record<string, PlanetDescription> {
  return Object.fromEntries(
    languages.map(({ id, name }) => [id, getFallbackDescription(id, name)])
  )
}

/**
 * 개인화 로드맵 생성
 * 1. Supabase 캐시 확인 (핑거프린트 일치 시 Gemini 호출 없음)
 * 2. 캐시 미스 → Gemini 호출 (~450 토큰)
 * 3. Gemini 미설정 → 하드코딩 폴백
 */
export async function getPersonalizedRoadmap(
  username: string,
  commitsByLanguage: Record<string, number>
): Promise<PersonalizedRoadmap | null> {
  const fingerprint = buildStackFingerprint(commitsByLanguage)

  // ── L1 캐시: 인메모리 (레이트 리밋 방어) ─────────────────────────────
  const memCached = memoryCache.get(fingerprint)
  if (memCached) return memCached

  // ── L2 캐시: Supabase (핑거프린트 기반) ──────────────────────────────
  const cached = await getCachedRoadmap(username, fingerprint)
  if (cached) {
    const result: PersonalizedRoadmap = {
      languageId: cached.roadmap.languageId,
      languageName: cached.roadmap.languageName,
      description: cached.roadmap.reason,
      learningRecommendation: cached.roadmap.learningPath.join(" → "),
      stackFingerprint: fingerprint,
    }
    memoryCache.set(fingerprint, result)
    return result
  }

  // ── Gemini 호출 ───────────────────────────────────────────────────────
  const maxCommits = Math.max(...Object.values(commitsByLanguage), 1)
  const stack: StackEntry[] = Object.entries(commitsByLanguage)
    .filter(([, c]) => c > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)                    // 상위 6개 언어만 전달 (토큰 절약)
    .map(([lang, commits]) => ({
      languageId: lang.toLowerCase(),
      languageName: lang,
      commits,
      isPrimary: commits / maxCommits >= 0.4,
    }))

  const geminiResult = await generateRoadmapWithAI(stack)

  if (geminiResult) {
    const result: PersonalizedRoadmap = {
      languageId: geminiResult.languageId,
      languageName: geminiResult.languageName,
      description: geminiResult.reason,
      learningRecommendation: geminiResult.learningPath.join(" → "),
      stackFingerprint: fingerprint,
    }
    memoryCache.set(fingerprint, result)
    setCachedRoadmap(username, {
      roadmap: geminiResult,
      stackFingerprint: fingerprint,
      generatedAt: new Date().toISOString(),
    }).catch(console.error)
    return result
  }

  // ── 폴백: 하드코딩 진행 경로 ─────────────────────────────────────────
  const knownIds = stack.map((s) => s.languageId)
  const fallback = selectFallbackRoadmap(knownIds)
  if (!fallback) return null

  const fallbackDesc = getFallbackDescription(fallback.languageId, fallback.languageName)
  return {
    languageId: fallback.languageId,
    languageName: fallback.languageName,
    description: fallbackDesc.description,
    learningRecommendation: fallbackDesc.learningRecommendation,
    stackFingerprint: fingerprint,
  }
}
