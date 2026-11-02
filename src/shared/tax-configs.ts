import type { YearConfig } from './types.js';
import { config2025 } from './tax-config-2025.js';
import { config2026 } from './tax-config-2026.js';
import { config2027 } from './tax-config-2027.js';

const CONFIGS: YearConfig[] = [config2025, config2026, config2027];

/**
 * Default config for a year. Years without their own config use the nearest
 * known year (earliest for past years, latest for future years).
 */
export function defaultConfigForYear(year: number): YearConfig {
  const exact = CONFIGS.find((c) => c.year === year);
  const base =
    exact ??
    (year < CONFIGS[0].year ? CONFIGS[0] : CONFIGS[CONFIGS.length - 1]);
  return structuredClone({ ...base, year });
}
