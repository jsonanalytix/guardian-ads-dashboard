import { Link, useLocation } from 'react-router-dom'
import { ChevronRight, Home } from 'lucide-react'

const breadcrumbLabels: Record<string, string> = {
  performance: 'Performance',
  overview: 'Overview',
  campaigns: 'Campaigns',
  keywords: 'Keywords',
  ads: 'Ads',
  'search-terms': 'Search Terms',
  efficiency: 'Efficiency',
  'quality-score': 'Quality Score',
  'impression-share': 'Impression Share',
  'wasted-spend': 'Wasted Spend',
  targeting: 'Targeting',
  geo: 'Geographic',
  devices: 'Devices',
  schedule: 'Day & Hour',
  products: 'Products',
  competitive: 'Competitive',
  conversions: 'Conversions',
  'landing-pages': 'Landing Pages',
  settings: 'Settings',
}

export function Breadcrumbs() {
  const location = useLocation()
  const pathSegments = location.pathname.split('/').filter(Boolean)

  if (pathSegments.length === 0) return null

  return (
    <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
      <Link
        to="/"
        className="flex items-center gap-1 hover:text-foreground transition-colors"
      >
        <Home className="h-3.5 w-3.5" />
      </Link>
      {pathSegments.map((segment, index) => {
        const path = '/' + pathSegments.slice(0, index + 1).join('/')
        const isLast = index === pathSegments.length - 1
        const label = breadcrumbLabels[segment] || segment

        return (
          <span key={path} className="flex items-center gap-1.5">
            <ChevronRight className="h-3.5 w-3.5" />
            {isLast ? (
              <span className="font-medium text-foreground">{label}</span>
            ) : (
              <Link to={path} className="hover:text-foreground transition-colors">
                {label}
              </Link>
            )}
          </span>
        )
      })}
    </nav>
  )
}
