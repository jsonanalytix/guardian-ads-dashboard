// Phase 5: Added theme toggle button for dark/light/system mode
// Phase 7: Wired date range picker to global DateRangeContext
// Phase 8: Added "Custom" date range option to global header picker
// Phase 9: Implemented custom start/end date controls and apply behavior
import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Menu, Bell, Calendar, Sun, Moon, Monitor } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { useTheme, type Theme } from '@/hooks/use-theme'
import { useDateRange, type DateRangeKey } from '@/hooks/use-date-range'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface HeaderProps {
  onMenuClick: () => void
}

const routeTitles: Record<string, string> = {
  '/': 'Executive Summary',
  '/performance/overview': 'Performance Overview',
  '/performance/campaigns': 'Campaign Performance',
  '/performance/keywords': 'Keyword Performance',
  '/performance/ads': 'Ad Performance',
  '/performance/search-terms': 'Search Term Intelligence',
  '/efficiency/quality-score': 'Quality Score Analysis',
  '/efficiency/impression-share': 'Impression Share',
  '/efficiency/wasted-spend': 'Wasted Spend Analyzer',
  '/targeting/geo': 'Geographic Performance',
  '/targeting/devices': 'Device Performance',
  '/targeting/schedule': 'Day & Hour Analysis',
  '/products': 'Product Analytics',
  '/competitive': 'Competitive Intelligence',
  '/conversions/overview': 'Conversion Overview',
  '/conversions/landing-pages': 'Landing Page Performance',
  '/settings': 'Settings',
}

const themeOrder: Theme[] = ['light', 'dark', 'system']
const themeIcons = { light: Sun, dark: Moon, system: Monitor }
const themeLabels = { light: 'Light mode', dark: 'Dark mode', system: 'System theme' }

export function Header({ onMenuClick }: HeaderProps) {
  const location = useLocation()
  const title = routeTitles[location.pathname] || 'Dashboard'
  const { theme, setTheme } = useTheme()
  const { dateRange, setDateRange, customStartDate, customEndDate, setCustomDateRange } = useDateRange()
  const [draftStartDate, setDraftStartDate] = useState(customStartDate)
  const [draftEndDate, setDraftEndDate] = useState(customEndDate)

  useEffect(() => {
    setDraftStartDate(customStartDate)
    setDraftEndDate(customEndDate)
  }, [customStartDate, customEndDate])

  const cycleTheme = () => {
    const currentIndex = themeOrder.indexOf(theme)
    const nextIndex = (currentIndex + 1) % themeOrder.length
    setTheme(themeOrder[nextIndex]!)
  }

  const ThemeIcon = themeIcons[theme]

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 lg:px-6">
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onMenuClick}
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">Toggle menu</span>
      </Button>

      {/* Page title */}
      <div className="flex-1">
        <h1 className="text-lg font-semibold">{title}</h1>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Date range selector */}
        <div className="hidden items-center gap-2 sm:flex">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRangeKey)}>
            <SelectTrigger className="h-9 w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="14d">Last 14 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="ytd">Year to Date</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {dateRange === 'custom' && (
          <div className="hidden items-center gap-2 md:flex">
            <Input
              type="date"
              value={draftStartDate}
              onChange={(e) => setDraftStartDate(e.target.value)}
              className="h-9 w-[140px]"
              max={draftEndDate || undefined}
              aria-label="Custom start date"
            />
            <span className="text-xs text-muted-foreground">to</span>
            <Input
              type="date"
              value={draftEndDate}
              onChange={(e) => setDraftEndDate(e.target.value)}
              className="h-9 w-[140px]"
              min={draftStartDate || undefined}
              aria-label="Custom end date"
            />
            <Button
              size="sm"
              variant="outline"
              className="h-9"
              onClick={() => setCustomDateRange(draftStartDate, draftEndDate)}
              disabled={!draftStartDate || !draftEndDate}
            >
              Apply
            </Button>
          </div>
        )}

        <Separator orientation="vertical" className="hidden h-6 sm:block" />

        {/* Theme toggle */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={cycleTheme}>
              <ThemeIcon className="h-5 w-5" />
              <span className="sr-only">{themeLabels[theme]}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>{themeLabels[theme]}</TooltipContent>
        </Tooltip>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-destructive" />
          <span className="sr-only">Notifications</span>
        </Button>
      </div>
    </header>
  )
}
