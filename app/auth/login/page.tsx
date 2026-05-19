"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Github, Telescope, ArrowRight } from "lucide-react"

const hasSupabase = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const stars = Array.from({ length: 50 }, (_, i) => ({
  left: (i * 37) % 100,
  top: (i * 53) % 100,
  opacity: 0.15 + ((i * 17) % 45) / 100,
}))

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState("")

  const handleGitHubOAuth = async () => {
    const { createClient } = await import("@/lib/supabase/client")
    const supabase = createClient()
    const callbackUrl = new URL("/auth/callback", window.location.origin)
    callbackUrl.searchParams.set("next", "/universe")
    await supabase.auth.signInWithOAuth({
      provider: "github",
      options: { redirectTo: callbackUrl.toString(), scopes: "read:user user:email" },
    })
  }

  const handleUsernameSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = username.trim()
    if (!trimmed) return
    router.push(`/universe?username=${encodeURIComponent(trimmed)}`)
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-muted/20" />

      <div className="absolute inset-0">
        {stars.map((star, i) => (
          <div
            key={i}
            className="absolute w-px h-px bg-foreground/20 rounded-full"
            style={{ left: `${star.left}%`, top: `${star.top}%`, opacity: star.opacity }}
          />
        ))}
      </div>

      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-2xl p-8">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center mb-4">
              <Telescope className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-semibold text-foreground">Planet Map</h1>
            <p className="text-sm text-muted-foreground mt-1">개발자 성장 시각화 플랫폼</p>
          </div>

          <div className="text-center mb-8">
            <p className="text-sm text-muted-foreground leading-relaxed">
              계정 하나를 항성으로 두고<br />
              언어와 기술 위성을 확인하세요.
            </p>
          </div>

          {hasSupabase ? (
            /* Supabase 설정 있음 → GitHub OAuth */
            <>
              <Button
                onClick={handleGitHubOAuth}
                className="w-full h-12 bg-foreground text-background hover:bg-foreground/90 gap-3"
              >
                <Github className="w-5 h-5" />
                GitHub로 계속하기
              </Button>
              <div className="mt-6 p-3 bg-muted/30 rounded-lg">
                <p className="text-xs text-muted-foreground text-center">기본 계정 정보만 요청합니다.</p>
              </div>
            </>
          ) : (
            /* Supabase 미설정 → 사용자명 직접 입력 */
            <form onSubmit={handleUsernameSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">GitHub 사용자명</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Github className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="예: torvalds"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="pl-9 h-11"
                      autoFocus
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={!username.trim()}
                    className="h-11 px-4 gap-1.5"
                  >
                    탐색
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="text-xs text-muted-foreground text-center">
                  공개 GitHub 데이터만 조회합니다.
                </p>
              </div>
            </form>
          )}

          <div className="mt-8 pt-6 border-t border-border/50">
            <p className="text-xs text-muted-foreground text-center">
              계속 진행하면 서비스 이용약관에 동의하는 것으로 간주됩니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
