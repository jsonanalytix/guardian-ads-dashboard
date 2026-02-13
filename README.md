# Guardian Google Ads Analytics Dashboard

A comprehensive analytics dashboard for managing and monitoring Guardian's Google Ads campaigns across all product lines.

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Tech Stack

- **Framework**: Vite + React 18 + TypeScript
- **Routing**: React Router v6
- **Styling**: Tailwind CSS 3 + shadcn/ui component library
- **Charts**: Recharts
- **Icons**: Lucide React
- **Date Handling**: date-fns

## Project Structure

```
src/
├── components/
│   ├── ui/          # shadcn/ui primitives (Button, Card, Badge, etc.)
│   ├── layout/      # App shell: Sidebar, Header, Breadcrumbs
│   ├── charts/      # Reusable chart components (Product Donut, etc.)
│   ├── tables/      # Reusable table components
│   └── cards/       # KPI cards, metric cards, alert cards
├── pages/
│   ├── executive/   # Executive Summary (landing page)
│   ├── performance/ # Campaign, keyword, ad, search term views
│   ├── efficiency/  # Quality score, impression share, wasted spend
│   ├── targeting/   # Geo, device, day-parting
│   ├── products/    # Product-level analytics
│   ├── competitive/ # Auction insights
│   ├── conversions/ # Conversion intelligence
│   └── settings/    # Dashboard config
├── data/
│   ├── mock/        # Mock data JSON modules
│   ├── types.ts     # TypeScript interfaces
│   └── index.ts     # Data access layer
├── hooks/           # Custom hooks (useAsync, etc.)
└── lib/             # Utilities (formatters, cn helper)
```

## Build Phases

- **Phase 1** (current): Foundation + Executive Summary with mock data
- **Phase 2**: Performance Hub pages (campaigns, keywords, search terms, ads)
- **Phase 3**: Efficiency + Targeting analytics
- **Phase 4**: Products, Competitive, Conversions
- **Phase 5**: Polish, dark mode, responsive QA, Cloudflare Pages deploy

## Data Architecture

Currently using mock data that mirrors the eventual Supabase schema. The data access layer (`src/data/index.ts`) exports async functions that can be swapped to Supabase queries with zero component changes.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | TypeScript check + production build |
| `npm run preview` | Preview production build locally |
