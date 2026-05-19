import Anthropic from "@anthropic-ai/sdk"

export interface PlanetDescription {
  description: string
  learningRecommendation: string
}

// Language progression order for roadmap selection
const LEARNING_PROGRESSION: Record<string, string[]> = {
  javascript: ["typescript", "python", "go"],
  typescript: ["go", "rust", "python"],
  python:     ["go", "rust", "java"],
  java:       ["kotlin", "go", "rust"],
  go:         ["rust", "python", "typescript"],
  rust:       ["go", "python", "typescript"],
}

/**
 * Selects the next recommended language for the user to learn
 * based on their current stack.
 */
export function selectRoadmapLanguage(knownLanguageIds: string[]): string | null {
  const known = new Set(knownLanguageIds)

  for (const langId of knownLanguageIds) {
    const candidates = LEARNING_PROGRESSION[langId] ?? []
    const next = candidates.find((c) => !known.has(c))
    if (next) return next
  }

  // Fallback: suggest the most common first language not yet learned
  const defaults = ["javascript", "typescript", "python", "go", "rust"]
  return defaults.find((l) => !known.has(l)) ?? null
}

/**
 * Calls Claude to generate descriptions and learning recommendations
 * for each language in the user's stack, plus the roadmap language.
 */
export async function generateDescriptions(
  currentLanguages: Array<{ id: string; name: string; commits: number }>,
  roadmapLanguageId: string | null
): Promise<Record<string, PlanetDescription>> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return generateFallbackDescriptions(currentLanguages, roadmapLanguageId)
  }

  const client = new Anthropic({ apiKey })

  const stackSummary = currentLanguages
    .map((l) => `- ${l.name}: ${l.commits} commits`)
    .join("\n")

  const allLanguages = [
    ...currentLanguages.map((l) => l.id),
    ...(roadmapLanguageId ? [roadmapLanguageId] : []),
  ]

  const prompt = `당신은 개발자 커리어 멘토입니다.
아래 개발자의 GitHub 기술 스택을 분석하고, 각 언어에 대한 짧은 설명과 학습 추천을 JSON으로 작성해주세요.

**현재 기술 스택:**
${stackSummary}
${roadmapLanguageId ? `\n**다음 추천 언어:** ${roadmapLanguageId}` : ""}

**요구 형식 (JSON):**
{
  "<언어id>": {
    "description": "해당 언어의 특징과 이 개발자의 스택에서 갖는 의미 (2-3 문장, 한국어)",
    "learningRecommendation": "구체적인 학습 로드맵과 추천 리소스 (2-3 문장, 한국어)"
  }
}

분석할 언어: ${allLanguages.join(", ")}

JSON만 반환하고 다른 텍스트는 포함하지 마세요.`

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      messages: [{ role: "user", content: prompt }],
    })

    const text = message.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { type: "text"; text: string }).text)
      .join("")

    // Strip markdown code fences if present
    const jsonText = text.replace(/^```(?:json)?\n?/m, "").replace(/\n?```$/m, "").trim()
    const parsed = JSON.parse(jsonText) as Record<string, PlanetDescription>
    return parsed
  } catch (err) {
    console.error("[roadmap] LLM generation failed, using fallback:", err)
    return generateFallbackDescriptions(currentLanguages, roadmapLanguageId)
  }
}

function generateFallbackDescriptions(
  currentLanguages: Array<{ id: string; name: string; commits: number }>,
  roadmapLanguageId: string | null
): Record<string, PlanetDescription> {
  const fallbacks: Record<string, PlanetDescription> = {
    javascript: {
      description:
        "웹의 언어. 브라우저와 서버 모두에서 동작하는 범용 언어로 가장 넓은 생태계를 보유합니다.",
      learningRecommendation:
        "MDN 웹 문서와 javascript.info를 통해 기초를 다지고, 이후 모던 JS(ES2022+) 패턴을 학습하세요.",
    },
    typescript: {
      description:
        "JavaScript에 정적 타입을 더한 언어. 대규모 프로젝트에서 버그를 줄이고 생산성을 높입니다.",
      learningRecommendation:
        "공식 TypeScript Handbook을 정독하고, 'type-challenges' 레포지토리로 타입 시스템을 깊게 익히세요.",
    },
    python: {
      description:
        "읽기 쉬운 문법으로 데이터 과학, 웹, 자동화 등 다양한 분야에서 활용되는 만능 언어입니다.",
      learningRecommendation:
        "공식 튜토리얼로 시작해 FastAPI 또는 Django로 웹 개발을, Pandas로 데이터 분석을 경험해보세요.",
    },
    go: {
      description:
        "Google이 만든 컴파일 언어. 간결한 문법과 뛰어난 동시성 처리로 백엔드와 인프라 도구에 강점이 있습니다.",
      learningRecommendation:
        "go.dev/tour를 완주한 뒤, 'Effective Go'와 실제 CLI/API 서버 프로젝트를 만들어보세요.",
    },
    rust: {
      description:
        "메모리 안전성과 최고 수준의 성능을 동시에 보장하는 시스템 프로그래밍 언어입니다.",
      learningRecommendation:
        "'The Rust Programming Language' 공식 책을 정독하고, rustlings 연습 문제로 소유권 시스템을 익히세요.",
    },
    java: {
      description:
        "강한 타입 시스템과 방대한 생태계를 가진 엔터프라이즈 표준 언어입니다.",
      learningRecommendation:
        "Spring Boot 공식 가이드로 시작해 JPA와 RESTful API 구현 패턴을 익히세요.",
    },
    kotlin: {
      description:
        "Java의 장점을 유지하면서 현대적인 문법을 제공하는 JVM 언어. Android 개발의 공식 언어입니다.",
      learningRecommendation:
        "Kotlin 공식 playground에서 시작해 코루틴과 Ktor 프레임워크를 학습하세요.",
    },
  }

  const result: Record<string, PlanetDescription> = {}

  for (const lang of currentLanguages) {
    result[lang.id] = fallbacks[lang.id] ?? {
      description: `${lang.name}은(는) 현재 ${lang.commits}번의 커밋으로 활발히 사용 중인 언어입니다.`,
      learningRecommendation: `공식 문서와 커뮤니티 튜토리얼을 통해 심화 학습을 진행해보세요.`,
    }
  }

  if (roadmapLanguageId) {
    result[roadmapLanguageId] = fallbacks[roadmapLanguageId] ?? {
      description: `${roadmapLanguageId}은(는) 당신의 스택을 확장할 다음 언어입니다.`,
      learningRecommendation: `공식 문서와 입문 튜토리얼로 첫 발을 내딛어보세요.`,
    }
  }

  return result
}
