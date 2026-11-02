# Agent Guide — tax-planner

## Quick Reference

- **Type check**: `npx tsc --noEmit`
- **Tests**: `npx vitest run` (all server-side)
- **Dev**: `npm run dev` (Express on :3456, Vite on :5173)
- **Data dir**: `data/` (gitignored, JSON files)

## Project Structure

```
src/
  shared/           Shared between client and server
    types.ts        All interfaces: form data, computation results, TaxAmount
    schemas.ts      Zod schemas matching each type (validation + defaults)
    tax-config-{2025,2026,2027}.ts   Year-specific brackets/thresholds (MFJ only)
    tax-configs.ts  defaultConfigForYear() — picks the config for a year (nearest year as fallback)
  server/           Express API (runs with tsx)
    index.ts        Express app, routes, port 3456
    storage.ts      JSON file persistence (read/write/clone years)
    routes/         REST endpoints: years, forms, config, compute
    engine/         Tax computation modules (pure functions)
      index.ts      Main computeTax() — aggregates income, calls sub-modules
      federal-income.ts   Ordinary income tax brackets
      capital-gains.ts    LTCG/qualified dividends (stacked rates)
      amt.ts              Alternative minimum tax
      niit.ts             Net investment income tax (3.8%)
      medicare.ts         Additional Medicare tax (0.9%)
      deductions.ts       Itemized vs standard (SALT cap, charitable)
      hsa.ts              HSA deduction
      credits.ts          Child tax credit, foreign tax credit
      colorado.ts         Colorado flat rate
      fbar.ts             FBAR/Form 8938 thresholds
      social-security.ts  SS tax computation
    __tests__/engine/   Unit + integration tests (vitest)
  client/           React SPA (Vite + Tailwind)
    main.tsx        Entry point
    App.tsx         Root component — year selection, routing, data loading
    api.ts          Fetch wrappers for /api/* endpoints
    pages/          Route-level: DashboardPage, FormsPage, ForeignAccountsPage, ConfigPage
    components/
      layout/       AppShell (sidebar nav), YearSelector
      dashboard/    TaxSummaryCard, TaxBreakdownChart, DeductionComparison,
                    EstimateWarnings, FBARStatusCard, WithholdingRatesCard
      forms/        One component per form type + shared primitives
      foreign/      FBARTracker
scripts/
  gdrive-backup.sh  Backup/restore data/ to Google Drive via rclone (-r to restore)
```

## Key Patterns

### Data Flow
1. Client fetches data from Express API (`/api/years/:year/data`, `/api/years/:year/compute`)
2. Express reads JSON from `data/{year}-data.json`, validates with Zod schema
3. `computeTax()` takes `TaxYearData` + `YearConfig`, returns `ComputationResult`
4. Client saves via PATCH to `/api/years/:year/data` (partial merge)

### TaxAmount Type
`TaxAmount = number | { value: number; isEstimate: true }` — legacy per-field estimate format. Still in the type system and schemas for backward compatibility with existing data files. New code uses form-level `isEstimate: boolean` flag instead.

Helper functions in `types.ts`:
- `amountValue(a)` — extracts the number from either format
- `isEstimate(a)` — checks per-field estimate (legacy, still exported)

### Form-Level Estimates
- 12 form interfaces have `isEstimate?: boolean`: W2, 1099-INT/DIV/B/G/R, 1098, K-1, ForeignRental, ForeignBank, HSA, Charitable
- NOT on: ForeignAccountData (informational), FilingData, EstimatedPaymentsData, EducationCreditsData
- Engine `collectEstimates()` checks `form.isEstimate` flag, produces one `EstimateWarning` per form
- `EstimateWarning` has only `{ form: string }` (no field/value)
- Clone logic (`storage.ts:cloneFormAsEstimate`) shallow-copies + sets `isEstimate: true` + new UUID

### Form Components
**Array forms** (W2, 1099-*, K-1, 1098): `useState<FormData[]>`, each card has header strip (`bg-gray-50`) with owner/name/EstimateToggle/remove, body with MoneyInput grid.

**Single forms** (HSA, ForeignIncome): `useState<FormData>`, card with header strip containing EstimateToggle.

**Charitable**: Itemized donation list. `CharitableData` has `donations: CharitableDonation[]` where each donation has `description`, `amount`, and `type` ('cash'|'property'). Engine sums by type for AGI limit calculations. Schema has `.transform()` for backward compat with old `{ cashDonations, propertyDonations }` format.

**MoneyInput**: Accepts `TaxAmount | undefined` for reading (backward compat), emits `number`. Has `estimated?: boolean` prop for amber styling. Labels are dimmed (`text-xs text-gray-400`).

**EstimateToggle**: Pill button, `{ isEstimate: boolean; onChange: (v: boolean) => void }`.

**YTDEstimator**: Collapsible panel on estimated W-2s. Takes YTD paycheck values, extrapolates to full year via `totalPayPeriods / payPeriodsCompleted` factor, fills W-2 fields.

### Path Aliases
- `@shared/*` → `src/shared/*`
- `@server/*` → `src/server/*`
- `@client/*` → `src/client/*`
Configured in both `tsconfig.json` (paths) and `vite.config.ts` (resolve.alias).

### API Routes
All under `/api/years`:
- `GET /` — list years
- `POST /` — create year `{ year, cloneFrom? }`
- `DELETE /:year` — delete year
- `GET /:year/data` — full year data
- `PATCH /:year/data` — partial merge
- `GET /:year/config` — year config
- `PATCH /:year/config` — partial merge config
- `DELETE /:year/config` — reset to defaults
- `GET /:year/compute` — run tax computation
- CRUD for `/:year/foreign-accounts` (inline in index.ts)

### Styling
Tailwind CSS. Cards use `rounded-lg border-gray-100` with `bg-gray-50` header strips. Estimated forms use `border-amber-200 bg-amber-50/20` with `bg-amber-50/60` headers. No custom CSS beyond Tailwind utilities.

## Common Tasks

**Add a new form type**: Add interface to `types.ts` → schema to `schemas.ts` → add to `TaxYearData` + `TaxYearDataSchema` → handle in `computeTax()` → handle in `collectEstimates()` if it gets `isEstimate` → handle in `cloneDataAsEstimates()` → create React component → add route in FormsPage → add to FormList.

**Add a new tax computation**: Create module in `engine/`, export pure function, call from `engine/index.ts`, add tests in `__tests__/engine/`.

**Modify tax brackets/thresholds**: Edit `tax-config-{year}.ts` or use the Config page in the UI. Note each year's config is persisted to `data/{year}-config.json` on first read, so changing defaults does not affect existing years until you click "Reset to Defaults" on the Config page.

**Add a new tax year config**: Create `tax-config-{year}.ts` and register it in `tax-configs.ts`.
