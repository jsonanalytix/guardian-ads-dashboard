// ============================================================
// 404 Not Found page
// Phase 5: Catch-all route for unmatched paths
// ============================================================

import { Link } from 'react-router-dom'
import { Home, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="text-8xl font-bold text-muted-foreground/20">404</div>
      <h1 className="mt-4 text-xl font-semibold">Page not found</h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        The page you're looking for doesn't exist or has been moved. Use the navigation sidebar or return to the dashboard.
      </p>
      <div className="mt-6 flex gap-3">
        <Button variant="outline" size="sm" asChild>
          <Link to="/" className="gap-1.5">
            <ArrowLeft className="h-4 w-4" />
            Go back
          </Link>
        </Button>
        <Button size="sm" asChild>
          <Link to="/" className="gap-1.5">
            <Home className="h-4 w-4" />
            Dashboard
          </Link>
        </Button>
      </div>
    </div>
  )
}
