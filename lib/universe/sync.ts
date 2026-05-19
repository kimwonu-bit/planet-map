import { fetchGitHubContributions } from "@/lib/github/graphql"
import { detectAllFrameworks } from "@/lib/github/dependencies"
import { mapToPlanets } from "@/lib/universe/mapper"
import { selectRoadmapLanguage, generateDescriptions } from "@/lib/universe/roadmap"
import type { CachedUniverse, CachedActivity } from "@/lib/universe/cache"

export interface SyncResult {
  universe: CachedUniverse
  activity: CachedActivity
}

/**
 * Main sync function: fetches all GitHub data, calculates orbits,
 * generates LLM descriptions, and returns structured data.
 * Call this on cache miss; the result should be stored in cache.
 */
export async function syncUserUniverse(
  username: string,
  token: string
): Promise<SyncResult> {
  // 1. Fetch contributions + commit calendar from GitHub GraphQL
  const contrib = await fetchGitHubContributions(username, token)

  // 2. Detect frameworks from dependency files in top repos
  const repoRefs = contrib.repoContributions.map((r) => ({
    nameWithOwner: r.nameWithOwner,
    language: r.language,
    commitCount: r.commitCount,
  }))
  const frameworksByLang = await detectAllFrameworks(repoRefs, token)

  // 3. Build langId-indexed frameworks map (dependency parser uses "javascript" keys)
  const frameworksByLangId: typeof frameworksByLang = {}
  for (const [key, metas] of Object.entries(frameworksByLang)) {
    const normalised = key.toLowerCase().replace(/\s+/g, "-")
    frameworksByLangId[normalised] = metas
  }

  // 4. Determine roadmap language
  const knownLanguageIds = Object.keys(contrib.commitsByLanguage).map((l) =>
    l.toLowerCase().replace(/\s+/g, "-")
  )
  const roadmapLanguageId = selectRoadmapLanguage(knownLanguageIds)

  // 5. Generate AI descriptions (with graceful fallback)
  const langList = Object.entries(contrib.commitsByLanguage).map(([name, commits]) => ({
    id: name.toLowerCase().replace(/\s+/g, "-"),
    name,
    commits,
  }))
  const llmDescriptions = await generateDescriptions(langList, roadmapLanguageId)

  // 6. Calculate today's commits per language (approximated from today's total proportionally)
  const todayCommitsByLanguage = approximateTodayByLanguage(
    contrib.commitsByLanguage,
    contrib.todayCommits
  )

  // 7. Map everything → PlanetData[]
  const planets = mapToPlanets(
    contrib.commitsByLanguage,
    frameworksByLangId,
    todayCommitsByLanguage,
    roadmapLanguageId,
    llmDescriptions
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
    recentActivity: contrib.repoContributions
      .slice(0, 30)
      .map((r) => ({
        repoName: r.repoName,
        language: r.language,
        commitCount: r.commitCount,
        date: now,
      })),
    syncedAt: now,
  }

  return { universe, activity }
}

/**
 * Approximates today's commits per language by distributing today's total
 * proportionally to each language's historical share.
 * The GitHub GraphQL API doesn't break down daily commits by language,
 * so this is the best approximation without per-repo daily queries.
 */
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

  // Fix rounding drift on the top language
  if (entries.length > 0) {
    const topLang = entries[0][0]
    result[topLang] = Math.max(0, (result[topLang] ?? 0) + (todayTotal - assigned))
  }

  return result
}
