import { useEffect, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { isSupabaseConfigured } from '@/lib/supabase'
import { Loader2 } from 'lucide-react'

/**
 * Redirects unauthenticated users to /login.
 * If Supabase is not configured (no env vars), the guard is bypassed
 * so the dashboard remains usable during local development with mock data.
 */
export function AuthGuard({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && !session && isSupabaseConfigured) {
      navigate('/login', { replace: true })
    }
  }, [loading, session, navigate])

  if (!isSupabaseConfigured) {
    return <>{children}</>
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!session) {
    return null
  }

  return <>{children}</>
}
