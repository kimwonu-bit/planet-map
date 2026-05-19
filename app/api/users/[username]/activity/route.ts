import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { hasSupabaseConfig } from "@/lib/supabase/config"
import { getCachedActivity } from "@/lib/universe/cache"
import { fetchGitHubContributions } from "@/lib/github/graphql"

export const runtime = "nodejs"

const GITHUB_USERNAME_RE = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params
  const url = new URL(request.url)
  const limit = Math.min(50, parseInt(url.searchParams.get("limit") ?? "20", 10))

  if (!GITHUB_USERNAME_RE.test(username)) {
    return NextResponse.json({ error: "Invalid GitHub username." }, { status: 400 })
  }

  // ── 1. Token resolution ────────────────────────────────────────────────
  let githubToken: string | undefined

  if (hasSupabaseConfig()) {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    githubToken = session?.provider_token ?? undefined
  }
  if (!githubToken) githubToken = process.env.GITHUB_TOKEN

  if (!githubToken) {
    return NextResponse.json({ error: "No GitHub token available." }, { status: 401 })
  }

  // ── 2. Cache lookup ────────────────────────────────────────────────────
  const cached = await getCachedActivity(username)
  if (cached) {
    return NextResponse.json(
      { ...cached, recentActivity: cached.recentActivity.slice(0, limit) },
      { headers: { "X-Cache": "HIT" } }
    )
  }

  // ── 3. Lightweight GitHub fetch (contributions only, no dep files) ─────
  try {
    const contrib = await fetchGitHubContributions(username, githubToken)

    const todayStr = new Date().toISOString().split("T")[0]

    const payload = {
      username,
      todayCommits: contrib.todayCommits,
      commitStreakDays: contrib.commitStreakDays,
      recentActivity: contrib.repoContributions
        .slice(0, limit)
        .map((r) => ({
          repoName: r.repoName,
          language: r.language,
          commitCount: r.commitCount,
          date: todayStr,
        })),
      // Last 14 days for sparkline / heatmap
      recentDays: contrib.allDays
        .slice(-14)
        .map((d) => ({ date: d.date, commits: d.contributionCount })),
      syncedAt: new Date().toISOString(),
    }

    return NextResponse.json(payload, { headers: { "X-Cache": "MISS" } })
  } catch (err) {
    console.error("[/api/users/activity] Failed:", err)
    return NextResponse.json(
      { error: "Failed to fetch GitHub activity", detail: String(err) },
      { status: 502 }
    )
  }
}
