import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { hasSupabaseConfig } from "@/lib/supabase/config"
import { getCachedUniverse, setCachedUniverse } from "@/lib/universe/cache"
import { syncUserUniverse } from "@/lib/universe/sync"

export const runtime = "nodejs"

// GitHub username: 1-39 chars, alphanumeric + hyphens, no leading/trailing hyphen
const GITHUB_USERNAME_RE = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params

  if (!GITHUB_USERNAME_RE.test(username)) {
    return NextResponse.json({ error: "Invalid GitHub username." }, { status: 400 })
  }

  // ── 1. Resolve GitHub token ────────────────────────────────────────────
  let githubToken: string | undefined

  if (hasSupabaseConfig()) {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    // provider_token is the GitHub OAuth token stored by Supabase
    githubToken = session?.provider_token ?? undefined
  }

  // Fall back to server-level PAT for public profile data
  if (!githubToken) {
    githubToken = process.env.GITHUB_TOKEN
  }

  if (!githubToken) {
    return NextResponse.json(
      { error: "No GitHub token available. Set GITHUB_TOKEN env var or sign in via GitHub OAuth." },
      { status: 401 }
    )
  }

  // ── 2. Cache lookup ────────────────────────────────────────────────────
  const cached = await getCachedUniverse(username)
  if (cached) {
    return NextResponse.json(cached, {
      headers: { "X-Cache": "HIT", "X-Cache-Age": String(getCacheAge(cached.syncedAt)) },
    })
  }

  // ── 3. Full sync ───────────────────────────────────────────────────────
  try {
    const { universe, activity } = await syncUserUniverse(username, githubToken)

    // Persist to cache (fire-and-forget in edge, await in node runtime)
    await Promise.all([
      setCachedUniverse(username, universe),
      import("@/lib/universe/cache").then(({ setCachedActivity }) =>
        setCachedActivity(username, activity)
      ),
    ])

    return NextResponse.json(universe, { headers: { "X-Cache": "MISS" } })
  } catch (err) {
    console.error("[/api/users/universe] Sync failed:", err)
    return NextResponse.json(
      { error: "Failed to fetch GitHub data", detail: String(err) },
      { status: 502 }
    )
  }
}

function getCacheAge(syncedAt: string): number {
  return Math.round((Date.now() - new Date(syncedAt).getTime()) / 1000)
}
