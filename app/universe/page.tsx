import { hasSupabaseConfig } from "@/lib/supabase/config"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { UniverseView } from "./universe-view"

export default async function UniversePage() {
  if (!hasSupabaseConfig()) {
    return <UniverseView username="Developer" />
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get GitHub user info from metadata
  const githubUsername = user.user_metadata?.user_name || user.user_metadata?.preferred_username || "Developer"
  const avatarUrl = user.user_metadata?.avatar_url

  return <UniverseView username={githubUsername} avatarUrl={avatarUrl} />
}
