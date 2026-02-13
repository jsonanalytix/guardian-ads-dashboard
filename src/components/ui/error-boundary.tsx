// ============================================================
// Error Boundary component
// Phase 5: Catches React rendering errors and displays a
// user-friendly fallback instead of crashing the entire app.
// ============================================================

import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ErrorBoundaryProps {
  /** Children to render */
  children: ReactNode
  /** Optional custom fallback UI */
  fallback?: ReactNode
  /** Called when an error is caught */
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    this.props.onError?.(error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex flex-col items-center justify-center rounded-lg border border-destructive/20 bg-destructive/5 p-12 text-center dark:bg-destructive/10">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 dark:bg-destructive/20">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <h3 className="mt-4 text-sm font-semibold">Something went wrong</h3>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            {this.state.error?.message || 'An unexpected error occurred while rendering this section.'}
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4 gap-1.5"
            onClick={this.handleReset}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Try again
          </Button>
        </div>
      )
    }

    return this.props.children
  }
}
