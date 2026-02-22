import type { YearConfig, TaxYearData } from '../../shared/types.js';

/**
 * Child Tax Credit: $2,000 per child, phaseout at $400k MFJ.
 * Reduces by $50 for each $1,000 over the phaseout threshold.
 */
export function computeChildTaxCredit(
  numChildren: number,
  agi: number,
  config: YearConfig
): number {
  if (numChildren <= 0) return 0;

  const fullCredit = numChildren * config.childTaxCredit.amount;
  if (agi <= config.childTaxCredit.phaseoutStart) return fullCredit;

  const excess = agi - config.childTaxCredit.phaseoutStart;
  const reduction = Math.ceil(excess / 1000) * (config.childTaxCredit.phaseoutRate * 1000);
  return Math.max(0, fullCredit - reduction);
}

/**
 * Foreign Tax Credit: limited to the proportion of US tax attributable to foreign income.
 * Simplified: sum of all foreign taxes paid, limited by (foreign income / total income) × US tax.
 */
export function computeForeignTaxCredit(
  totalForeignTaxPaid: number,
  foreignSourceIncome: number,
  totalIncome: number,
  usTaxBeforeCredits: number
): number {
  if (totalForeignTaxPaid <= 0) return 0;
  if (foreignSourceIncome <= 0 || totalIncome <= 0) return 0;

  const limitation = (foreignSourceIncome / totalIncome) * usTaxBeforeCredits;
  return Math.min(
    totalForeignTaxPaid,
    Math.round(limitation * 100) / 100
  );
}
