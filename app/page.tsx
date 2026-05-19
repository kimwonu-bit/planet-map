import Link from "next/link"
import { hasSupabaseConfig } from "@/lib/supabase/config"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Telescope, Github, ArrowRight, Eye } from "lucide-react"

export default async function HomePage() {
  const user = hasSupabaseConfig()
    ? (await (await createClient()).auth.getUser()).data.user
    : null

  // If already logged in, redirect to universe
  if (user) {
    redirect("/universe")
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Telescope className="w-4 h-4 text-primary" />
            </div>
            <span className="font-semibold text-foreground">DevUniverse</span>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link href="/auth/login">
              <Github className="w-4 h-4 mr-2" />
              로그인
            </Link>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-2xl text-center space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-muted/50 rounded-full text-sm text-muted-foreground">
            <Eye className="w-3.5 h-3.5" />
            <span>읽기 전용 뷰어</span>
          </div>

          {/* Title */}
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-5xl font-semibold text-foreground tracking-tight text-balance">
              당신의 개발 여정을<br />
              <span className="text-primary">우주</span>로 시각화하세요
            </h1>
            <p className="text-lg text-muted-foreground max-w-lg mx-auto text-pretty">
              하나의 계정을 항성으로 두고, 언어를 행성으로, 프레임워크와 기술을 위성으로 표현합니다.
            </p>
          </div>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button asChild size="lg" className="gap-2">
              <Link href="/auth/login">
                <Github className="w-4 h-4" />
                GitHub로 시작하기
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>

          {/* Note */}
          <p className="text-xs text-muted-foreground">
            계정 중심의 언어와 기술 관계만 표시합니다.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 py-6 px-4">
        <div className="container mx-auto text-center text-xs text-muted-foreground">
          DevUniverse - 개발자 성장 시각화 플랫폼
        </div>
      </footer>
    </div>
  )
}
