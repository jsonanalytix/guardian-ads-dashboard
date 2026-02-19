// Fix: guard against Supabase lock-manager timeouts so auth cannot hang indefinitely.
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import type { User, Session, AuthError } from '@supabase/supabase-js'
import {
  getSupabaseBrowserClient,
  isSupabaseConfigured,
} from '@/lib/supabase'

type UserRole = 'team' | 'admin'

interface AuthState {
  user: User | null
  session: Session | null
  role: UserRole | null
  loading: boolean
}

interface AuthContextValue extends AuthState {
  signIn: (
    email: string,
    password: string
  ) => Promise<{ error: AuthError | null }>
  signOut: () => Promise<void>
  isAdmin: boolean
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const AUTH_OP_TIMEOUT_MS = 8000

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return await Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Auth operation timed out after ${timeoutMs}ms`)), timeoutMs)
    ),
  ])
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    role: null,
    loading: true,
  })

  const fetchRole = useCallback(async (userId: string): Promise<UserRole> => {
    try {
      const supabase = getSupabaseBrowserClient()
      const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single()
      return (data?.role as UserRole) ?? 'team'
    } catch {
      return 'team'
    }
  }, [])

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setState({ user: null, session: null, role: null, loading: false })
      return
    }

    let mounted = true
    const supabase = getSupabaseBrowserClient()
    const failSafe = window.setTimeout(() => {
      if (!mounted) return
      setState((prev) => (prev.loading ? { ...prev, loading: false } : prev))
    }, AUTH_OP_TIMEOUT_MS + 2000)

    async function init() {
      try {
        const {
          data: { session },
        } = await withTimeout(supabase.auth.getSession(), AUTH_OP_TIMEOUT_MS)

        if (!mounted) return

        if (session?.user) {
          const role = await withTimeout(fetchRole(session.user.id), AUTH_OP_TIMEOUT_MS)
          if (mounted) {
            setState({ user: session.user, session, role, loading: false })
          }
        } else {
          setState({ user: null, session: null, role: null, loading: false })
        }
      } catch (err) {
        if (!mounted) return
        console.warn('Auth init failed; falling back to signed-out state:', err)
        setState({ user: null, session: null, role: null, loading: false })
      }
    }

    init()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (!mounted) return
      if (newSession?.user) {
        const role = await withTimeout(fetchRole(newSession.user.id), AUTH_OP_TIMEOUT_MS)
        if (mounted) {
          setState({
            user: newSession.user,
            session: newSession,
            role,
            loading: false,
          })
        }
      } else {
        setState({ user: null, session: null, role: null, loading: false })
      }
    })

    return () => {
      mounted = false
      window.clearTimeout(failSafe)
      subscription.unsubscribe()
    }
  }, [fetchRole])

  const signIn = useCallback(
    async (email: string, password: string) => {
      if (!isSupabaseConfigured) {
        return {
          error: { message: 'Supabase is not configured' } as AuthError,
        }
      }
      try {
        const supabase = getSupabaseBrowserClient()
        const { error } = await withTimeout(
          supabase.auth.signInWithPassword({
            email,
            password,
          }),
          AUTH_OP_TIMEOUT_MS
        )
        return { error }
      } catch (err) {
        return {
          error: {
            name: 'AuthTimeoutError',
            message: err instanceof Error ? err.message : 'Sign in timed out',
          } as AuthError,
        }
      }
    },
    []
  )

  const signOut = useCallback(async () => {
    if (!isSupabaseConfigured) return
    const supabase = getSupabaseBrowserClient()
    await supabase.auth.signOut()
  }, [])

  const value: AuthContextValue = {
    ...state,
    signIn,
    signOut,
    isAdmin: state.role === 'admin',
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an <AuthProvider>')
  }
  return ctx
}
