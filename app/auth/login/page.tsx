"use client"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Github, Telescope } from "lucide-react"

const stars = Array.from({ length: 50 }, (_, i) => {
  const left = (i * 37) % 100
  const top = (i * 53) % 100
  const opacity = 0.15 + ((i * 17) % 45) / 100

  return { left, top, opacity }
})

export default function LoginPage() {
  const handleGitHubLogin = async () => {
    const supabase = createClient()
    const callbackUrl = new URL("/auth/callback", window.location.origin)
    callbackUrl.searchParams.set("next", "/universe")
    
    await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: callbackUrl.toString(),
        scopes: "read:user user:email",
      },
    })
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden">
      {/* Subtle background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-muted/20" />
      
      {/* Minimal star effect */}
      <div className="absolute inset-0">
        {stars.map((star, i) => (
          <div
            key={i}
            className="absolute w-px h-px bg-foreground/20 rounded-full"
            style={{
              left: `${star.left}%`,
              top: `${star.top}%`,
              opacity: star.opacity,
            }}
          />
        ))}
      </div>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-2xl p-8">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center mb-4">
              <Telescope className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-semibold text-foreground">DevUniverse</h1>
            <p className="text-sm text-muted-foreground mt-1">개발자 성장 시각화 플랫폼</p>
          </div>

          {/* Description */}
          <div className="text-center mb-8">
            <p className="text-sm text-muted-foreground leading-relaxed">
              계정 하나를 항성으로 두고<br />
              언어와 기술 위성을 확인하세요.
            </p>
          </div>

          {/* GitHub Login Button */}
          <Button
            onClick={handleGitHubLogin}
            className="w-full h-12 bg-foreground text-background hover:bg-foreground/90 gap-3"
          >
            <Github className="w-5 h-5" />
            GitHub로 계속하기
          </Button>

          {/* Note */}
          <div className="mt-6 p-3 bg-muted/30 rounded-lg">
            <p className="text-xs text-muted-foreground text-center">
              기본 계정 정보만 요청합니다.
            </p>
          </div>

          {/* Footer */}
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
