"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { hasSupabaseConfig } from "@/lib/supabase/config"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  Telescope,
  LogOut,
  ChevronDown,
  Eye,
} from "lucide-react"
import Image from "next/image"

interface UniverseHeaderProps {
  username: string
  avatarUrl?: string
  totalCommits: number
  totalPlanets: number
}

export function UniverseHeader({ username, avatarUrl, totalCommits, totalPlanets }: UniverseHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const router = useRouter()

  const handleLogout = async () => {
    if (!hasSupabaseConfig()) {
      router.push("/")
      return
    }

    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-20 bg-background/60 backdrop-blur-xl border-b border-border/30">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Telescope className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h1 className="font-semibold text-sm text-foreground">DevUniverse</h1>
          </div>
        </div>

        {/* Stats */}
        <div className="hidden sm:flex items-center gap-4">
          <StatBadge label="활동량" value={totalCommits.toLocaleString()} />
          <StatBadge label="언어" value={totalPlanets.toString()} />
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-muted/30 rounded text-xs text-muted-foreground">
            <Eye className="w-3 h-3" />
            <span>계정 보기</span>
          </div>
        </div>

        {/* User Menu */}
        <div className="relative">
          <Button
            variant="ghost"
            className="gap-2 h-9 px-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={username}
                width={28}
                height={28}
                className="rounded-full"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-xs font-medium text-primary">{username[0]?.toUpperCase()}</span>
              </div>
            )}
            <span className="hidden sm:block text-sm font-medium text-foreground">{username}</span>
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
          </Button>

          {isMenuOpen && (
            <>
              <div className="fixed inset-0" onClick={() => setIsMenuOpen(false)} />
              <div className="absolute right-0 top-full mt-1 w-48 bg-card border border-border rounded-lg shadow-xl overflow-hidden">
                <div className="p-3 border-b border-border">
                  <p className="font-medium text-sm text-foreground">{username}</p>
                  <p className="text-xs text-muted-foreground">
                    Account Star
                  </p>
                </div>
                <div className="p-1">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted rounded transition-colors"
                  >
                    <LogOut className="w-4 h-4 text-muted-foreground" />
                    로그아웃
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

function StatBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  )
}
