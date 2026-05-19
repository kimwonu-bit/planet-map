import { hasSupabaseConfig } from "@/lib/supabase/config"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { UniverseView } from "./universe-view"

interface Props {
  searchParams: Promise<{ username?: string }>
}

export default async function UniversePage({ searchParams }: Props) {
  if (!hasSupabaseConfig()) {
    // Supabase 미설정 시 URL 파라미터에서 사용자명 읽기
    const params = await searchParams
    const username = params.username?.trim() || ""
    if (!username) redirect("/auth/login")
    return <UniverseView username={username} />
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const githubUsername =
    user.user_metadata?.user_name ||
    user.user_metadata?.preferred_username ||
    "Developer"
  const avatarUrl = user.user_metadata?.avatar_url

  return <UniverseView username={githubUsername} avatarUrl={avatarUrl} />
}
