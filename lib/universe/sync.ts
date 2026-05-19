import { fetchGitHubContributions } from "@/lib/github/graphql"
import { detectAllFrameworks } from "@/lib/github/dependencies"
import { mapToPlanets } from "@/lib/universe/mapper"
import { getLanguageDescriptions, getPersonalizedRoadmap } from "@/lib/universe/roadmap"
import type { CachedUniverse, CachedActivity } from "@/lib/universe/cache"

export interface SyncResult {
  universe: CachedUniverse
  activity: CachedActivity
}

export async function syncUserUniverse(
  username: string,
  token: string
): Promise<SyncResult> {
  // 1. GitHub 기여 데이터 (GraphQL 단일 쿼리)
  const contrib = await fetchGitHubContributions(username, token)

  // 2. 의존성 파일 파싱 → 프레임워크 감지
  const repoRefs = contrib.repoContributions.map((r) => ({
    nameWithOwner: r.nameWithOwner,
    language: r.language,
    commitCount: r.commitCount,
  }))
  const frameworksByLang = await detectAllFrameworks(repoRefs, token)

  // lib key 정규화 (dependency parser는 원본 언어명 키를 사용)
  const frameworksByLangId: typeof frameworksByLang = {}
  for (const [key, metas] of Object.entries(frameworksByLang)) {
    frameworksByLangId[key.toLowerCase().replace(/\s+/g, "-")] = metas
  }

  // 3. 언어 목록 구성
  const langList = Object.entries(contrib.commitsByLanguage).map(([name, commits]) => ({
    id: name.toLowerCase().replace(/\s+/g, "-"),
    name,
    commits,
  }))

  // 4. 언어 설명 — 하드코딩 (0 토큰)
  const llmDescriptions = getLanguageDescriptions(langList)

  // 5. 개인화 로드맵 — Gemini + 핑거프린트 캐싱
  const roadmap = await getPersonalizedRoadmap(username, contrib.commitsByLanguage)

  // 6. 오늘 커밋 언어별 분배 (비율 추정)
  const todayCommitsByLanguage = approximateTodayByLanguage(
    contrib.commitsByLanguage,
    contrib.todayCommits
  )

  // 7. 최종 PlanetData[] 조립
  const planets = mapToPlanets(
    contrib.commitsByLanguage,
    frameworksByLangId,
    todayCommitsByLanguage,
    roadmap ? roadmap.languageId : null,
    {
      ...llmDescriptions,
      // 로드맵 언어에는 AI가 생성한 맞춤 설명 주입
      ...(roadmap
        ? {
            [roadmap.languageId]: {
              description: roadmap.description,
              learningRecommendation: roadmap.learningRecommendation,
            },
          }
        : {}),
    }
  )

  const now = new Date().toISOString()

  const universe: CachedUniverse = {
    username,
    avatarUrl: contrib.avatarUrl,
    totalCommits: contrib.totalCommits,
    todayCommits: contrib.todayCommits,
    commitStreakDays: contrib.commitStreakDays,
    planets,
    syncedAt: now,
  }

  const activity: CachedActivity = {
    username,
    recentActivity: contrib.repoContributions.slice(0, 30).map((r) => ({
      repoName: r.repoName,
      language: r.language,
      commitCount: r.commitCount,
      date: now,
    })),
    syncedAt: now,
  }

  return { universe, activity }
}

function approximateTodayByLanguage(
  commitsByLanguage: Record<string, number>,
  todayTotal: number
): Record<string, number> {
  if (todayTotal === 0) return {}
  const total = Object.values(commitsByLanguage).reduce((s, v) => s + v, 0)
  if (total === 0) return {}

  const result: Record<string, number> = {}
  let assigned = 0
  const entries = Object.entries(commitsByLanguage).sort((a, b) => b[1] - a[1])

  for (const [lang, count] of entries) {
    const share = Math.round((count / total) * todayTotal)
    result[lang] = share
    assigned += share
  }
  if (entries.length > 0) {
    const topLang = entries[0][0]
    result[topLang] = Math.max(0, (result[topLang] ?? 0) + (todayTotal - assigned))
  }
  return result
}
