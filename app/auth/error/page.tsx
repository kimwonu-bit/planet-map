import Link from "next/link"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4 max-w-md mx-4">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8 text-destructive" />
        </div>
        <h1 className="text-xl font-semibold text-foreground">인증 오류</h1>
        <p className="text-sm text-muted-foreground">
          GitHub 로그인 중 문제가 발생했습니다. 다시 시도해주세요.
        </p>
        <Button asChild>
          <Link href="/auth/login">다시 로그인</Link>
        </Button>
      </div>
    </div>
  )
}
