export interface ContributionDay {
  date: string
  contributionCount: number
}

interface ContributionWeek {
  contributionDays: ContributionDay[]
}

interface RepoContribution {
  repository: {
    name: string
    nameWithOwner: string
    primaryLanguage: { name: string } | null
  }
  contributions: { totalCount: number }
}

export interface GitHubContribData {
  avatarUrl: string
  totalCommits: number
  todayCommits: number
  commitStreakDays: number
  // language name → commit count
  commitsByLanguage: Record<string, number>
  // for activity endpoint: sorted by contribution count
  repoContributions: Array<{
    repoName: string
    nameWithOwner: string
    language: string | null
    commitCount: number
  }>
  // raw calendar for streak / daily breakdown
  allDays: ContributionDay[]
}

const CONTRIB_QUERY = `
  query GetContributions($username: String!) {
    user(login: $username) {
      avatarUrl
      contributionsCollection {
        totalCommitContributions
        commitContributionsByRepository(maxRepositories: 50) {
          repository {
            name
            nameWithOwner
            primaryLanguage { name }
          }
          contributions { totalCount }
        }
        contributionCalendar {
          weeks {
            contributionDays {
              date
              contributionCount
            }
          }
        }
      }
    }
  }
`

export async function fetchGitHubContributions(
  username: string,
  token: string
): Promise<GitHubContribData> {
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: CONTRIB_QUERY, variables: { username } }),
    next: { revalidate: 0 },
  })

  if (!res.ok) {
    throw new Error(`GitHub GraphQL HTTP ${res.status}`)
  }

  const { data, errors } = await res.json()
  if (errors?.length) throw new Error(`GitHub GraphQL: ${errors[0].message}`)

  const collection = data.user.contributionsCollection
  const allDays: ContributionDay[] = collection.contributionCalendar.weeks.flatMap(
    (w: ContributionWeek) => w.contributionDays
  )

  const todayStr = new Date().toISOString().split("T")[0]
  const todayEntry = allDays.find((d) => d.date === todayStr)
  const todayCommits = todayEntry?.contributionCount ?? 0
  const commitStreakDays = calculateStreak(allDays)

  const commitsByLanguage: Record<string, number> = {}
  const repoContributions = (collection.commitContributionsByRepository as RepoContribution[]).map(
    (entry) => {
      const lang = entry.repository.primaryLanguage?.name ?? null
      const count = entry.contributions.totalCount
      if (lang) {
        commitsByLanguage[lang] = (commitsByLanguage[lang] ?? 0) + count
      }
      return {
        repoName: entry.repository.name,
        nameWithOwner: entry.repository.nameWithOwner,
        language: lang,
        commitCount: count,
      }
    }
  )

  return {
    avatarUrl: data.user.avatarUrl,
    totalCommits: collection.totalCommitContributions,
    todayCommits,
    commitStreakDays,
    commitsByLanguage,
    repoContributions,
    allDays,
  }
}

function calculateStreak(days: ContributionDay[]): number {
  const dayMap = new Map(days.map((d) => [d.date, d.contributionCount]))

  const todayStr = new Date().toISOString().split("T")[0]
  const cursor = new Date(todayStr)

  // If today has no commits yet, start counting from yesterday
  if ((dayMap.get(todayStr) ?? 0) === 0) {
    cursor.setDate(cursor.getDate() - 1)
  }

  let streak = 0
  while (true) {
    const dateStr = cursor.toISOString().split("T")[0]
    if ((dayMap.get(dateStr) ?? 0) === 0) break
    streak++
    cursor.setDate(cursor.getDate() - 1)
  }

  return streak
}
