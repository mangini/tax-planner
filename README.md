# tax-planner

A personal tax planning and estimation tool for US federal + Colorado state taxes. Built for married-filing-jointly households with complex tax situations (W-2 income, investments, K-1 partnerships, foreign income, FBAR reporting).

This is a local-first app — all data stays on your machine in JSON files. No cloud, no accounts.

## What it does

- Computes federal income tax (ordinary + capital gains + AMT + NIIT + additional Medicare)
- Computes Colorado state tax
- Tracks FBAR/Form 8938 filing requirements
- Handles year-over-year cloning with estimated values
- YTD paycheck estimator to project full-year W-2 from mid-year data

### Supported forms

W-2, 1099-INT, 1099-DIV, 1099-B, 1099-G, 1099-R, 1098, Schedule K-1, foreign rental/bank income, HSA, charitable contributions, estimated tax payments, education credits, foreign accounts (FBAR)

## Architecture

```
src/
  shared/          Types, schemas (zod), tax configs (2025/2026/2027)
  server/          Express API + tax engine
    engine/        Computation modules (federal, state, AMT, NIIT, etc.)
    routes/        REST endpoints
    storage.ts     JSON file persistence
  client/          React SPA (Vite + Tailwind)
    components/    Forms, dashboard, charts
    pages/         Route-level pages
data/              Your tax data (gitignored)
```

The server is a plain Express API that reads/writes JSON files from `data/`. The client is a React app with react-router. Both run locally via `npm run dev`.

## Setup

```bash
npm install
npm run dev
```

This starts both the Express server and Vite dev server concurrently. Open the URL shown in the terminal.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start server + client (dev mode) |
| `npm run build` | Build client + type-check |
| `npm test` | Run tests (vitest) |
| `npm run server` | Start only the Express server |
| `npm run client` | Start only the Vite client |

## Data storage

Tax data is stored as JSON files in the `data/` directory (gitignored):

- `{year}-data.json` — all form data for a tax year
- `{year}-config.json` — tax brackets and thresholds

When you create a new year and clone from a previous one, all forms are copied with `isEstimate: true` so you can track which values are still projections vs. final.

## Estimates

Forms can be toggled between "Estimated" and "Final". Estimated forms show amber styling throughout the UI and are listed in the dashboard warnings panel. When cloning a year, all forms start as estimated.

W-2 forms have a YTD Estimator: enter your paycheck year-to-date values and total pay periods, and it extrapolates full-year W-2 amounts.

## Tax engine

The engine computes taxes in this order:

1. Aggregate income by category (wages, interest, dividends, capital gains, K-1, foreign, retirement)
2. Above-the-line deductions (HSA)
3. AGI
4. Itemized vs. standard deduction (mortgage interest, SALT cap, charitable)
5. Taxable income
6. Ordinary income tax (federal brackets)
7. Capital gains tax (preferential rates, stacked on ordinary)
8. AMT
9. NIIT (3.8% on investment income above threshold)
10. Additional Medicare tax (0.9% on wages above threshold)
11. Credits (child tax credit, foreign tax credit)
12. Colorado flat rate on federal taxable income
13. FBAR/Form 8938 thresholds

All computation modules have unit tests. The integration test covers a full scenario with all form types.

## License

Apache 2.0
