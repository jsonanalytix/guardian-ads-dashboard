import { FlaskConical, X } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { isSupabaseConfigured } from '@/lib/supabase'

export function MockDataBanner() {
  const [dismissed, setDismissed] = useState(false)

  if (isSupabaseConfigured || dismissed) return null

  return (
    <div className="relative flex items-center justify-center gap-2 border-b border-amber-300/40 bg-amber-50 px-4 py-2 text-sm text-amber-800 dark:border-amber-500/20 dark:bg-amber-950/30 dark:text-amber-200">
      <FlaskConical className="h-4 w-4 shrink-0" />
      <span>
        <strong>Demo Mode</strong> — All data shown is mock data for demonstration purposes only.
        Live data integration coming soon.
      </span>
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-1 top-1/2 h-6 w-6 -translate-y-1/2 text-amber-600 hover:bg-amber-200/50 hover:text-amber-800 dark:text-amber-400 dark:hover:bg-amber-800/30 dark:hover:text-amber-200"
        onClick={() => setDismissed(true)}
      >
        <X className="h-3.5 w-3.5" />
        <span className="sr-only">Dismiss banner</span>
      </Button>
    </div>
  )
}
