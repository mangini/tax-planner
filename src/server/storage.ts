import fs from 'fs';
import path from 'path';
import { v4 as uuid } from 'uuid';
import { TaxYearDataSchema, YearConfigSchema } from '../shared/schemas.js';
import type { TaxYearData, YearConfig } from '../shared/types.js';
import { defaultConfigForYear } from '../shared/tax-configs.js';

const DATA_DIR = process.env.TAX_DATA_DIR || path.resolve(process.cwd(), 'data');

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function dataPath(year: number): string {
  return path.join(DATA_DIR, `${year}-data.json`);
}

function configPath(year: number): string {
  return path.join(DATA_DIR, `${year}-config.json`);
}

function defaultConfig(year: number): YearConfig {
  return defaultConfigForYear(year);
}

// ─── Clone helpers ───

/** Shallow-clone a form object, set isEstimate: true, assign a new id */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function cloneFormAsEstimate<T>(obj: T): T {
  const out: any = { ...(obj as any), isEstimate: true };
  if ('id' in out) out.id = uuid();
  return out as T;
}

/** Clone a foreign account — new id only, no isEstimate (informational) */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function cloneForeignAccount<T>(obj: T): T {
  const out: any = { ...(obj as any), id: uuid() };
  return out as T;
}

/** Clone TaxYearData for a new year, marking all dollar values as estimates */
function cloneDataAsEstimates(source: TaxYearData, newYear: number): TaxYearData {
  return {
    year: newYear,
    filing: { ...source.filing },
    w2: source.w2.map(cloneFormAsEstimate),
    form1099INT: source.form1099INT.map(cloneFormAsEstimate),
    form1099DIV: source.form1099DIV.map(cloneFormAsEstimate),
    form1099B: source.form1099B.map(cloneFormAsEstimate),
    form1099G: source.form1099G.map(cloneFormAsEstimate),
    form1099R: source.form1099R.map(cloneFormAsEstimate),
    form1098: source.form1098.map(cloneFormAsEstimate),
    scheduleK1: source.scheduleK1.map(cloneFormAsEstimate),
    foreignRentalIncome: source.foreignRentalIncome
      ? cloneFormAsEstimate(source.foreignRentalIncome) : undefined,
    foreignBankIncome: source.foreignBankIncome
      ? cloneFormAsEstimate(source.foreignBankIncome) : undefined,
    hsa: source.hsa
      ? cloneFormAsEstimate(source.hsa) : undefined,
    charitable: source.charitable
      ? cloneFormAsEstimate(source.charitable) : undefined,
    foreignAccounts: source.foreignAccounts.map(cloneForeignAccount),
    // Estimated payments reset to zero — they're year-specific
    estimatedPayments: undefined,
  };
}

// ─── Public API ───

export function listYears(): number[] {
  ensureDataDir();
  const files = fs.readdirSync(DATA_DIR);
  const years = new Set<number>();
  for (const f of files) {
    const match = f.match(/^(\d{4})-(data|config)\.json$/);
    if (match) years.add(parseInt(match[1], 10));
  }
  return Array.from(years).sort();
}

export function yearExists(year: number): boolean {
  return fs.existsSync(dataPath(year));
}

export function createYear(year: number, cloneFrom?: number): TaxYearData {
  ensureDataDir();
  let data: TaxYearData;
  if (cloneFrom && yearExists(cloneFrom)) {
    data = cloneDataAsEstimates(readYearData(cloneFrom), year);
  } else {
    data = TaxYearDataSchema.parse({ year }) as TaxYearData;
  }
  writeYearData(year, data);

  // Also create config if it doesn't exist
  if (!fs.existsSync(configPath(year))) {
    writeYearConfig(year, defaultConfig(year));
  }
  return data;
}

export function deleteYear(year: number): void {
  const dp = dataPath(year);
  const cp = configPath(year);
  if (fs.existsSync(dp)) fs.unlinkSync(dp);
  if (fs.existsSync(cp)) fs.unlinkSync(cp);
}

export function readYearData(year: number): TaxYearData {
  const raw = fs.readFileSync(dataPath(year), 'utf-8');
  return TaxYearDataSchema.parse(JSON.parse(raw)) as TaxYearData;
}

export function writeYearData(year: number, data: TaxYearData): void {
  ensureDataDir();
  fs.writeFileSync(dataPath(year), JSON.stringify(data, null, 2), 'utf-8');
}

export function readYearConfig(year: number): YearConfig {
  const cp = configPath(year);
  if (!fs.existsSync(cp)) {
    const cfg = defaultConfig(year);
    writeYearConfig(year, cfg);
    return cfg;
  }
  const raw = fs.readFileSync(cp, 'utf-8');
  return YearConfigSchema.parse(JSON.parse(raw));
}

export function writeYearConfig(year: number, config: YearConfig): void {
  ensureDataDir();
  fs.writeFileSync(configPath(year), JSON.stringify(config, null, 2), 'utf-8');
}

export function mergeYearData(year: number, partial: Record<string, unknown>): TaxYearData {
  const existing = readYearData(year);
  const merged = { ...existing, ...partial, year };
  const validated = TaxYearDataSchema.parse(merged) as TaxYearData;
  writeYearData(year, validated);
  return validated;
}

export function mergeYearConfig(year: number, partial: Record<string, unknown>): YearConfig {
  const existing = readYearConfig(year);
  const merged = { ...existing, ...partial, year };
  const validated = YearConfigSchema.parse(merged);
  writeYearConfig(year, validated);
  return validated;
}
