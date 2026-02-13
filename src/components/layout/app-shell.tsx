import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './sidebar'
import { Header } from './header'
import { Breadcrumbs } from './breadcrumbs'
import { MockDataBanner } from './mock-data-banner'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'

export function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r bg-background lg:block">
        <Sidebar />
      </aside>

      {/* Mobile sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <Sidebar onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header onMenuClick={() => setMobileOpen(true)} />
        <MockDataBanner />

        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto max-w-7xl px-4 py-6 lg:px-8">
            <div className="mb-6">
              <Breadcrumbs />
            </div>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
