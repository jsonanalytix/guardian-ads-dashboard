import { NavLink, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  LayoutDashboard,
  BarChart3,
  Gauge,
  Target,
  Package,
  Swords,
  ArrowRightLeft,
  Settings,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'
import { useState } from 'react'

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
  children?: { label: string; href: string }[]
}

const navigation: NavItem[] = [
  {
    label: 'Executive Summary',
    href: '/',
    icon: LayoutDashboard,
  },
  {
    label: 'Performance',
    href: '/performance',
    icon: BarChart3,
    children: [
      { label: 'Overview', href: '/performance/overview' },
      { label: 'Campaigns', href: '/performance/campaigns' },
      { label: 'Keywords', href: '/performance/keywords' },
      { label: 'Ads', href: '/performance/ads' },
      { label: 'Search Terms', href: '/performance/search-terms' },
    ],
  },
  {
    label: 'Efficiency',
    href: '/efficiency',
    icon: Gauge,
    children: [
      { label: 'Quality Score', href: '/efficiency/quality-score' },
      { label: 'Impression Share', href: '/efficiency/impression-share' },
      { label: 'Wasted Spend', href: '/efficiency/wasted-spend' },
    ],
  },
  {
    label: 'Targeting',
    href: '/targeting',
    icon: Target,
    children: [
      { label: 'Geographic', href: '/targeting/geo' },
      { label: 'Devices', href: '/targeting/devices' },
      { label: 'Day & Hour', href: '/targeting/schedule' },
    ],
  },
  {
    label: 'Products',
    href: '/products',
    icon: Package,
  },
  {
    label: 'Competitive',
    href: '/competitive',
    icon: Swords,
  },
  {
    label: 'Conversions',
    href: '/conversions',
    icon: ArrowRightLeft,
    children: [
      { label: 'Overview', href: '/conversions/overview' },
      { label: 'Landing Pages', href: '/conversions/landing-pages' },
    ],
  },
  {
    label: 'Settings',
    href: '/settings',
    icon: Settings,
  },
]

interface SidebarProps {
  onNavigate?: () => void
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const location = useLocation()
  const [expandedItems, setExpandedItems] = useState<string[]>(() => {
    // Auto-expand the section that contains the current route
    const current = navigation.find(
      (item) =>
        item.children?.some((child) => location.pathname === child.href) ||
        location.pathname === item.href
    )
    return current?.children ? [current.href] : []
  })

  const toggleExpand = (href: string) => {
    setExpandedItems((prev) =>
      prev.includes(href) ? prev.filter((h) => h !== href) : [...prev, href]
    )
  }

  const isActive = (item: NavItem) => {
    if (location.pathname === item.href) return true
    if (item.children?.some((child) => location.pathname === child.href)) return true
    return false
  }

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b px-6">
        <img src="/guardian-logo.svg" alt="Guardian" className="h-8 w-8" />
        <div>
          <h1 className="text-sm font-bold text-foreground">Guardian</h1>
          <p className="text-[10px] text-muted-foreground">Google Ads Dashboard</p>
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon
            const active = isActive(item)
            const expanded = expandedItems.includes(item.href)

            if (item.children) {
              return (
                <div key={item.href}>
                  <button
                    onClick={() => toggleExpand(item.href)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                      active
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="flex-1 text-left">{item.label}</span>
                    {expanded ? (
                      <ChevronDown className="h-4 w-4 shrink-0" />
                    ) : (
                      <ChevronRight className="h-4 w-4 shrink-0" />
                    )}
                  </button>
                  {expanded && (
                    <div className="ml-4 mt-1 space-y-1 border-l pl-4">
                      {item.children.map((child) => (
                        <NavLink
                          key={child.href}
                          to={child.href}
                          onClick={onNavigate}
                          className={({ isActive: linkActive }) =>
                            cn(
                              'block rounded-md px-3 py-1.5 text-sm transition-colors',
                              linkActive
                                ? 'bg-primary/10 font-medium text-primary'
                                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                            )
                          }
                        >
                          {child.label}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              )
            }

            return (
              <NavLink
                key={item.href}
                to={item.href}
                end={item.href === '/'}
                onClick={onNavigate}
                className={({ isActive: linkActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    linkActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )
                }
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            )
          })}
        </nav>
      </ScrollArea>

      {/* Footer */}
      <div className="border-t px-6 py-3">
        <p className="text-xs text-muted-foreground">
          Last sync: Feb 12, 2026 8:00 AM
        </p>
      </div>
    </div>
  )
}
