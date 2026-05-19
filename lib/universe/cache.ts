import { createClient } from "@/lib/supabase/server"
import { hasSupabaseConfig } from "@/lib/supabase/config"
import type { PlanetData } from "@/components/space/Planet"
import type { RoadmapResult } from "@/lib/ai/github-models"

export interface CachedUniverse {
  username: string
  avatarUrl: string
  totalCommits: number
  todayCommits: number
  commitStreakDays: number
  planets: PlanetData[]
  syncedAt: string
}

export interface CachedActivity {
  username: string
  recentActivity: ActivityEntry[]
  syncedAt: string
}

export interface ActivityEntry {
  repoName: string
  language: string | null
  commitCount: number
  date: string
}

const UNIVERSE_TTL_MS  = 6 * 60 * 60 * 1000  // 6 hours
const ACTIVITY_TTL_MS  = 30 * 60 * 1000       // 30 minutes

// ─── Universe cache ────────────────────────────────────────────────────────

export async function getCachedUniverse(username: string): Promise<CachedUniverse | null> {
  if (!hasSupabaseConfig()) return null
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from("universe_cache")
      .select("data, synced_at")
      .eq("github_username", username)
      .single()

    if (!data) return null

    const age = Date.now() - new Date(data.synced_at).getTime()
    if (age > UNIVERSE_TTL_MS) return null

    return data.data as CachedUniverse
  } catch {
    return null
  }
}

export async function setCachedUniverse(
  username: string,
  payload: CachedUniverse
): Promise<void> {
  if (!hasSupabaseConfig()) return
  try {
    const supabase = await createClient()
    await supabase.from("universe_cache").upsert(
      { github_username: username, data: payload, synced_at: new Date().toISOString() },
      { onConflict: "github_username" }
    )
  } catch (err) {
    console.error("[cache] Failed to write universe cache:", err)
  }
}

// ─── Activity cache ────────────────────────────────────────────────────────

export async function getCachedActivity(username: string): Promise<CachedActivity | null> {
  if (!hasSupabaseConfig()) return null
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from("activity_cache")
      .select("data, synced_at")
      .eq("github_username", username)
      .single()

    if (!data) return null

    const age = Date.now() - new Date(data.synced_at).getTime()
    if (age > ACTIVITY_TTL_MS) return null

    return data.data as CachedActivity
  } catch {
    return null
  }
}

export async function setCachedActivity(
  username: string,
  payload: CachedActivity
): Promise<void> {
  if (!hasSupabaseConfig()) return
  try {
    const supabase = await createClient()
    await supabase.from("activity_cache").upsert(
      { github_username: username, data: payload, synced_at: new Date().toISOString() },
      { onConflict: "github_username" }
    )
  } catch (err) {
    console.error("[cache] Failed to write activity cache:", err)
  }
}

// ─── Roadmap cache (핑거프린트 기반, TTL 없음) ─────────────────────────────
// 스택 핑거프린트가 바뀔 때만 무효화 → Gemini 호출 최소화

export interface CachedRoadmap {
  roadmap: RoadmapResult
  stackFingerprint: string
  generatedAt: string
}

export async function getCachedRoadmap(
  username: string,
  currentFingerprint: string
): Promise<CachedRoadmap | null> {
  if (!hasSupabaseConfig()) return null
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from("user_roadmaps")
      .select("data")
      .eq("github_username", username)
      .single()

    if (!data) return null

    const cached = data.data as CachedRoadmap
    // 핑거프린트가 다르면 스택이 변한 것 → 캐시 무효
    if (cached.stackFingerprint !== currentFingerprint) return null

    return cached
  } catch {
    return null
  }
}

export async function setCachedRoadmap(
  username: string,
  payload: CachedRoadmap
): Promise<void> {
  if (!hasSupabaseConfig()) return
  try {
    const supabase = await createClient()
    await supabase.from("user_roadmaps").upsert(
      { github_username: username, data: payload, updated_at: new Date().toISOString() },
      { onConflict: "github_username" }
    )
  } catch (err) {
    console.error("[cache] Failed to write roadmap cache:", err)
  }
}
