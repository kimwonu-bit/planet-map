export interface RoadmapResult {
  languageId: string
  languageName: string
  reason: string          // 2문장 — 왜 이 언어가 이 사람에게 맞는지
  learningPath: string[]  // 3단계 구체적 학습 순서
}

export interface StackEntry {
  languageId: string
  languageName: string
  commits: number
  isPrimary: boolean
}

function inferDomain(stack: StackEntry[]): string {
  const ids = stack.map((s) => s.languageId)
  if (ids.some((id) => ["javascript", "typescript"].includes(id))) {
    const hasBackend = ids.some((id) => ["python", "go", "java", "rust"].includes(id))
    return hasBackend ? "풀스택" : "프론트엔드/웹"
  }
  if (ids.some((id) => ["python"].includes(id))) return "백엔드/데이터"
  if (ids.some((id) => ["java", "kotlin"].includes(id))) return "JVM 백엔드"
  if (ids.some((id) => ["go", "rust"].includes(id))) return "시스템/인프라"
  return "소프트웨어"
}

function buildPrompt(stack: StackEntry[]): string {
  const domain = inferDomain(stack)
  const stackSummary = stack
    .map((s) => `${s.languageName}(${s.commits}커밋${s.isPrimary ? ",주력" : ""})`)
    .join(", ")

  return `당신은 ${domain} 개발자 커리어 어드바이저입니다.
스택: ${stackSummary}

이 개발자에게 가장 적합한 다음 학습 언어 1개를 추천하고 JSON으로만 응답하세요.

{"languageId":"소문자영어id","languageName":"언어명","reason":"현재 스택과의 연관성을 포함한 2문장 추천 이유(한국어)","learningPath":["1단계(한국어)","2단계(한국어)","3단계(한국어)"]}`
}

// GitHub Models API (OpenAI 호환) — 기존 GITHUB_TOKEN 재사용, 추가 키 불필요
// 무료 한도: 15req/min, 모델별 TPM 제한 (gpt-4o-mini: 8K tokens/req)
export async function generateRoadmapWithAI(
  stack: StackEntry[]
): Promise<RoadmapResult | null> {
  const token = process.env.GITHUB_TOKEN
  if (!token || stack.length === 0) return null

  try {
    const response = await fetch(
      "https://models.inference.ai.azure.com/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: buildPrompt(stack) }],
          response_format: { type: "json_object" },
          max_tokens: 300,
          temperature: 0.4,
        }),
      }
    )

    if (!response.ok) {
      if (response.status === 429) {
        console.warn("[github-models] Rate limit hit (15 req/min). Using fallback roadmap.")
      } else {
        console.error("[github-models] API error:", response.status, await response.text())
      }
      return null
    }

    const json = await response.json() as {
      choices: Array<{ message: { content: string } }>
    }
    const text = json.choices?.[0]?.message?.content?.trim()
    if (!text) return null

    const parsed = JSON.parse(text) as RoadmapResult
    if (!parsed.languageId || !parsed.languageName || !parsed.reason) return null

    return {
      languageId: parsed.languageId.toLowerCase(),
      languageName: parsed.languageName,
      reason: parsed.reason,
      learningPath: Array.isArray(parsed.learningPath) ? parsed.learningPath.slice(0, 3) : [],
    }
  } catch (err) {
    console.error("[github-models] Roadmap generation failed:", err)
    return null
  }
}
