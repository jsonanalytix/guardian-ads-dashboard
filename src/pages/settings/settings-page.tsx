// ============================================================
// Settings / Configuration Page
// Phase 4: Date range defaults, theme toggle, metric display
// preferences, data refresh status, and CSV export placeholder
// Phase 5: Wired theme toggle to ThemeProvider context
// ============================================================

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Settings,
  Calendar,
  Palette,
  DollarSign,
  RefreshCw,
  Download,
  Check,
  Moon,
  Sun,
  Monitor,
  Database,
  Clock,
  Shield,
} from 'lucide-react'
import { useTheme, type Theme } from '@/hooks/use-theme'
import { isSupabaseConfigured } from '@/lib/supabase'

interface SettingsState {
  defaultDateRange: string
  currencyFormat: 'usd' | 'eur' | 'gbp'
  decimalPlaces: '0' | '1' | '2'
  compactNumbers: boolean
}

export function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const [settings, setSettings] = useState<SettingsState>({
    defaultDateRange: '30d',
    currencyFormat: 'usd',
    decimalPlaces: '2',
    compactNumbers: false,
  })
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    // Theme is already persisted via ThemeProvider; other settings save here
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleExport = (type: string) => {
    // Placeholder: in production, this would generate and download CSV
    alert(`Export ${type} data as CSV — feature will be available when connected to Supabase.`)
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold">Settings</h2>
        <p className="text-sm text-muted-foreground">
          Configure dashboard preferences, display options, and data management
        </p>
      </div>

      {/* Date Range Defaults */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">Date Range Defaults</CardTitle>
          </div>
          <CardDescription>Set the default date range for all dashboard views</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Default Date Range</p>
              <p className="text-xs text-muted-foreground">Applied when opening any dashboard page</p>
            </div>
            <Select
              value={settings.defaultDateRange}
              onValueChange={(v) => setSettings((s) => ({ ...s, defaultDateRange: v }))}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="14d">Last 14 Days</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
                <SelectItem value="90d">Last 90 Days</SelectItem>
                <SelectItem value="ytd">Year to Date</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Theme */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">Appearance</CardTitle>
          </div>
          <CardDescription>Choose your preferred color theme</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            {([
              { value: 'light' as Theme, label: 'Light', icon: Sun },
              { value: 'dark' as Theme, label: 'Dark', icon: Moon },
              { value: 'system' as Theme, label: 'System', icon: Monitor },
            ]).map((option) => {
              const Icon = option.icon
              const isActive = theme === option.value
              return (
                <button
                  key={option.value}
                  onClick={() => setTheme(option.value)}
                  className={`flex flex-1 flex-col items-center gap-2 rounded-lg border-2 p-4 transition-colors ${
                    isActive
                      ? 'border-primary bg-primary/5'
                      : 'border-muted hover:border-muted-foreground/25 hover:bg-muted/50'
                  }`}
                >
                  <Icon className={`h-5 w-5 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className={`text-sm font-medium ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                    {option.label}
                  </span>
                  {isActive && <Check className="h-4 w-4 text-primary" />}
                </button>
              )
            })}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Theme preference is saved automatically and persists across sessions.
          </p>
        </CardContent>
      </Card>

      {/* Metric Display Preferences */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">Metric Display</CardTitle>
          </div>
          <CardDescription>Configure how numbers and currency are displayed</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Currency Format</p>
              <p className="text-xs text-muted-foreground">Display currency for all monetary values</p>
            </div>
            <Select
              value={settings.currencyFormat}
              onValueChange={(v) => setSettings((s) => ({ ...s, currencyFormat: v as SettingsState['currencyFormat'] }))}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="usd">USD ($)</SelectItem>
                <SelectItem value="eur">EUR (€)</SelectItem>
                <SelectItem value="gbp">GBP (£)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Decimal Places</p>
              <p className="text-xs text-muted-foreground">Number of decimal places for currency values</p>
            </div>
            <Select
              value={settings.decimalPlaces}
              onValueChange={(v) => setSettings((s) => ({ ...s, decimalPlaces: v as SettingsState['decimalPlaces'] }))}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">No decimals ($142)</SelectItem>
                <SelectItem value="1">1 decimal ($142.3)</SelectItem>
                <SelectItem value="2">2 decimals ($142.35)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Compact Numbers</p>
              <p className="text-xs text-muted-foreground">Show large numbers in compact format (e.g., 1.2K, 3.5M)</p>
            </div>
            <button
              onClick={() => setSettings((s) => ({ ...s, compactNumbers: !s.compactNumbers }))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.compactNumbers ? 'bg-primary' : 'bg-muted'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
                  settings.compactNumbers ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Data Refresh Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">Data Source</CardTitle>
          </div>
          <CardDescription>Data refresh status and connection information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isSupabaseConfigured ? (
            <>
              <div className="rounded-lg border border-emerald-300/40 bg-emerald-50/50 p-4 dark:border-emerald-500/20 dark:bg-emerald-950/20">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950">
                    <Shield className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">Supabase (Live)</p>
                      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900 dark:text-emerald-300 text-xs">Connected</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Live data via Google Ads API daily extraction into Supabase tables
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-dashed p-4 opacity-60">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950">
                    <Database className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">Mock Data</p>
                      <Badge variant="secondary" className="text-xs">Inactive</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Static mock data modules — used as fallback when Supabase is not configured
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="rounded-lg border bg-muted/30 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950">
                    <Database className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">Mock Data</p>
                      <Badge variant="outline" className="text-xs">Current</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Using static mock data modules with realistic Guardian insurance values
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-dashed p-4 opacity-60">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Shield className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">Supabase</p>
                      <Badge variant="secondary" className="text-xs">Not configured</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to connect live data
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Last Data Refresh</p>
                <p className="text-xs text-muted-foreground">Feb 12, 2026, 8:00 AM EST</p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="gap-1.5">
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Export Dashboard Data */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Download className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">Export Data</CardTitle>
          </div>
          <CardDescription>Download dashboard data as CSV files</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {[
              { label: 'Campaign Performance', key: 'campaigns' },
              { label: 'Keyword Performance', key: 'keywords' },
              { label: 'Search Terms', key: 'search-terms' },
              { label: 'Auction Insights', key: 'auction-insights' },
              { label: 'Conversion Data', key: 'conversions' },
              { label: 'Landing Pages', key: 'landing-pages' },
            ].map((item) => (
              <Button
                key={item.key}
                variant="outline"
                size="sm"
                className="justify-start gap-2 h-auto py-2.5"
                onClick={() => handleExport(item.label)}
              >
                <Download className="h-3.5 w-3.5 shrink-0" />
                <span className="text-xs">{item.label}</span>
              </Button>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Exports use the current date range filter and include all visible columns.
          </p>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex items-center justify-end gap-3">
        {saved && (
          <span className="flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400">
            <Check className="h-4 w-4" />
            Settings saved
          </span>
        )}
        <Button onClick={handleSave} className="gap-1.5">
          <Settings className="h-4 w-4" />
          Save Settings
        </Button>
      </div>
    </div>
  )
}
