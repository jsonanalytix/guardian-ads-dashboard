# Guardian Google Ads Analytics Dashboard

A comprehensive analytics dashboard for managing and monitoring Guardian's Google Ads campaigns across all product lines (Term Life, Disability, Annuities, Dental Network, Group Benefits).

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Tech Stack

| Layer         | Technology                                       |
| ------------- | ------------------------------------------------ |
| **Framework** | Vite + React 18 + TypeScript                     |
| **Routing**   | React Router v6                                  |
| **Styling**   | Tailwind CSS 3 + shadcn/ui component library     |
| **Charts**    | Recharts                                         |
| **Tables**    | TanStack Table v8 (sortable, filterable, paged)  |
| **Icons**     | Lucide React                                     |
| **Dates**     | date-fns                                         |

---

## Project Structure

```
guardian-ads-dashboard/
├── public/
│   ├── guardian-logo.svg          # Brand logo
│   ├── _redirects                 # Cloudflare Pages SPA routing
│   └── _headers                   # Security headers
├── src/
│   ├── components/
│   │   ├── ui/                    # shadcn/ui primitives + custom UI
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── error-boundary.tsx # React error boundary
│   │   │   ├── loading-state.tsx  # Skeleton loading states
│   │   │   ├── empty-state.tsx    # Empty/no-data states
│   │   │   ├── page-wrapper.tsx   # Combines loading/error/empty
│   │   │   └── ...                # Select, Sheet, Tooltip, Tabs, etc.
│   │   ├── layout/
│   │   │   ├── app-shell.tsx      # Main layout with sidebar + header
│   │   │   ├── sidebar.tsx        # Collapsible navigation sidebar
│   │   │   ├── header.tsx         # Top bar with date range, theme toggle
│   │   │   ├── breadcrumbs.tsx    # Auto-generated breadcrumb trail
│   │   │   └── mock-data-banner.tsx
│   │   ├── charts/                # Reusable chart components
│   │   ├── tables/                # DataTable with sorting/pagination
│   │   └── cards/                 # KPI, health score, budget, alert cards
│   ├── pages/
│   │   ├── executive/             # Executive Summary (landing page)
│   │   ├── performance/           # Campaign, Keyword, Ad, Search Term views
│   │   ├── efficiency/            # Quality Score, Impression Share, Wasted Spend
│   │   ├── targeting/             # Geographic, Device, Day & Hour
│   │   ├── products/              # Product-level analytics
│   │   ├── competitive/           # Auction Insights
│   │   ├── conversions/           # Conversion Intelligence + Landing Pages
│   │   ├── settings/              # Dashboard configuration
│   │   └── not-found.tsx          # 404 page
│   ├── data/
│   │   ├── mock/                  # 14 mock data modules
│   │   ├── types.ts               # All TypeScript interfaces
│   │   └── index.ts               # Data access layer (async functions)
│   ├── hooks/
│   │   ├── use-data.ts            # useAsync hook for data fetching
│   │   └── use-theme.tsx          # Theme provider (dark/light/system)
│   └── lib/
│       └── utils.ts               # Formatters (currency, percent, etc.) + cn helper
├── wrangler.toml                  # Cloudflare Pages config
├── tailwind.config.ts
├── vite.config.ts
├── tsconfig.json
└── package.json
```

---

## Dashboard Sections

### 1. Executive Summary (`/`)
Account health score, KPI hero cards with sparklines, budget pacing gauges, top movers table, alerts & recommendations, and product spend distribution donut chart.

### 2. Performance Hub (`/performance/...`)
- **Overview** — Multi-metric time series with toggleable metrics and date ranges
- **Campaigns** — Full data table with filters (Product, Intent, Status), sorting, pagination
- **Keywords** — Keyword table with Quality Score badges and match type filtering
- **Ads** — RSA effectiveness, ad strength distribution, headline/description rankings
- **Search Terms** — Winner/loser classification, negative keyword opportunities, term clustering

### 3. Efficiency Analytics (`/efficiency/...`)
- **Quality Score** — QS distribution histogram, component breakdown, spend-weighted analysis
- **Impression Share** — Waterfall chart (captured vs lost to budget/rank), IS trends
- **Wasted Spend** — Zero-conversion keywords, irrelevant search terms, savings estimates

### 4. Audience & Targeting (`/targeting/...`)
- **Geographic** — State-level heatmap, top/bottom performers, regional CPA comparison
- **Devices** — Desktop/Mobile/Tablet split with bid adjustment recommendations
- **Day & Hour** — 7x24 heatmap with peak conversion window identification

### 5. Product Analytics (`/products`)
Product-level KPI cards, comparison charts, trend lines, strength indicators (strong/opportunity/risk).

### 6. Competitive Intelligence (`/competitive`)
Auction Insights table (overlap rate, position above rate, top-of-page rate, outranking share), share of voice trend chart, competitor movement alerts.

### 7. Conversion Intelligence (`/conversions/...`)
- **Overview** — Conversion volume/value trends, type breakdown, attribution comparison
- **Landing Pages** — Performance table with bounce rates, mobile vs desktop conversion rates

### 8. Settings (`/settings`)
Date range defaults, dark/light/system theme toggle, metric display preferences, data source status, CSV export.

---

## Theming

The dashboard supports three theme modes:

- **Light** — Default bright theme
- **Dark** — Dark background with adjusted contrast ratios
- **System** — Follows your OS preference

Toggle via the sun/moon icon in the header, or from the Settings page. Preference is persisted in `localStorage`.

The theme system uses CSS custom properties (HSL values) defined in `src/index.css`, with Tailwind's `darkMode: 'class'` strategy. The `.dark` class is applied to `<html>` by the `ThemeProvider` context.

---

## Data Architecture

Currently using **mock data** that mirrors the eventual Supabase schema. The data access layer (`src/data/index.ts`) exports async functions that can be swapped to Supabase queries with zero component changes:

```typescript
// Phase 1-4: Mock data
export async function getCampaignPerformance(filters: Filters): Promise<Campaign[]> {
  const { campaignData } = await import('./mock/campaigns')
  return applyFilters(campaignData, filters)
}

// Future: Supabase
// export async function getCampaignPerformance(filters: Filters): Promise<Campaign[]> {
//   const { data } = await supabase.from('campaign_performance').select('*')...
//   return data
// }
```

### Mock Data Modules (14 total)

| Module              | Future Supabase Table       | Description                   |
| ------------------- | --------------------------- | ----------------------------- |
| `accounts.ts`       | `google_ads_accounts`       | Account-level daily snapshots |
| `campaigns.ts`      | `campaign_performance`      | Daily campaign metrics        |
| `keywords.ts`       | `keyword_performance`       | Daily keyword metrics         |
| `search-terms.ts`   | `search_term_report`        | Daily search term data        |
| `ads.ts`            | `ad_performance`            | RSA performance + assets      |
| `budgets.ts`        | `budget_pacing`             | Daily budget consumption      |
| `alerts.ts`         | —                           | Generated alerts              |
| `top-movers.ts`     | —                           | Week-over-week changes        |
| `kpis.ts`           | —                           | Aggregated KPI summaries      |
| `health-score.ts`   | —                           | Composite health score        |
| `products.ts`       | `product_summary`           | Product-level aggregations    |
| `quality-scores.ts` | `quality_score_history`     | QS snapshots over time        |
| `geo.ts`            | `geo_performance`           | State/DMA daily metrics       |
| `devices.ts`        | `device_performance`        | Device segment daily data     |
| `hour-of-day.ts`    | `hourly_performance`        | Hour-of-day aggregations      |
| `auction-insights.ts`| `auction_insights`          | Competitor data               |
| `conversions.ts`    | `conversion_actions`        | Conversion type breakdowns    |
| `landing-pages.ts`  | `landing_page_performance`  | Landing page metrics          |

### Realistic Mock Data Values (Insurance Industry)

- **Monthly Budget**: ~$180K total ($65K Term Life, $40K Disability, $35K Annuities, $25K Dental, $15K Group)
- **CPAs**: $45-200 range depending on product
- **CPCs**: $8-22 (insurance is competitive)
- **CTRs**: 4-8% (search campaigns)
- **ROAS**: 2.5-4.5x depending on product
- **Quality Scores**: Distribution centered around 6-7
- **Top Competitors**: MetLife, Prudential, Northwestern Mutual, Unum, Lincoln Financial

---

## Error Handling

- **ErrorBoundary** (`src/components/ui/error-boundary.tsx`) — Wraps the entire app and individual page sections. Catches React rendering errors and shows a retry button.
- **useAsync hook** (`src/hooks/use-data.ts`) — All data fetching returns `{ data, loading, error }` for consistent state handling.
- **Loading states** (`src/components/ui/loading-state.tsx`) — Skeleton animations with variants: `page`, `cards`, `table`, `chart`, `inline`.
- **Empty states** (`src/components/ui/empty-state.tsx`) — Friendly UI for no-data and no-results scenarios.
- **404 page** (`src/pages/not-found.tsx`) — Catch-all route with navigation back to dashboard.

---

## Deployment (Cloudflare Pages)

### Option 1: GitHub Auto-Deploy

1. Push the repo to GitHub
2. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/) > Pages
3. Create a project and connect the GitHub repo
4. Configure build settings:
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Node.js version**: 18+
5. Deploy — Cloudflare auto-deploys on every push to `main`

### Option 2: Wrangler CLI

```bash
# Install Wrangler
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Build the project
npm run build

# Deploy to Cloudflare Pages
npx wrangler pages deploy dist
```

### SPA Routing

The `public/_redirects` file ensures all routes are handled by `index.html` for client-side routing:

```
/*    /index.html   200
```

### Security Headers

The `public/_headers` file applies security headers to all responses:

- `X-Frame-Options: DENY` — Prevents clickjacking
- `X-Content-Type-Options: nosniff` — Prevents MIME type sniffing
- `Referrer-Policy: strict-origin-when-cross-origin`
- Static assets (`/assets/*`) are cached with immutable headers

---

## Scripts

| Command           | Description                              |
| ----------------- | ---------------------------------------- |
| `npm run dev`     | Start Vite development server            |
| `npm run build`   | TypeScript check + production build      |
| `npm run preview` | Preview production build locally         |
| `npm run lint`    | Run ESLint                               |

## Google Ads ETL

The ETL pipeline now lives inside this app at `scripts/sync_google_ads.py` and is automated by `.github/workflows/sync-google-ads.yml`.

### Manual Run

```bash
python3 -m pip install -r scripts/requirements.txt
python3 scripts/sync_google_ads.py --help

# Default behavior: sync yesterday (UTC)
python3 scripts/sync_google_ads.py

# Single date
python3 scripts/sync_google_ads.py --date 2026-02-17

# Date range
python3 scripts/sync_google_ads.py --date-from 2026-02-01 --date-to 2026-02-17
```

### Required Secrets / Env Vars

Configure these values in GitHub Actions secrets (for workflow runs) and your local environment (for manual runs):

- `GOOGLE_ADS_DEVELOPER_TOKEN`
- `GOOGLE_ADS_CLIENT_ID`
- `GOOGLE_ADS_CLIENT_SECRET`
- `GOOGLE_ADS_REFRESH_TOKEN`
- `GOOGLE_ADS_CUSTOMER_ID`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`

---

## Build Phases

- [x] **Phase 1**: Foundation — Scaffold, layout, executive summary, mock data stubs
- [x] **Phase 2**: Performance Hub — Campaign, keyword, search term, ad pages + time series
- [x] **Phase 3**: Efficiency + Targeting — Quality score, impression share, wasted spend, geo, device, day/hour
- [x] **Phase 4**: Product, Competitive, Conversion pages + Settings
- [x] **Phase 5**: Dark/light mode, responsive QA, loading/error/empty states, Cloudflare Pages config, README

---

## Future Roadmap

- **Supabase Integration**: Replace mock data layer with live Supabase queries
- **Google Ads API**: Daily ETL pipeline to populate Supabase tables
- **Real-time Updates**: Supabase realtime subscriptions for live data refresh
- **Export**: CSV/PDF export functionality for all data views
- **User Auth**: Supabase Auth for multi-user access control
- **Custom Alerts**: Configurable alert thresholds and email notifications
