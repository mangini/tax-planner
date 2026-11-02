import type { YearConfig } from '../../shared/types.js';

/**
 * Child Tax Credit: config amount per child, phaseout at $400k MFJ.
 * Reduces by $50 for each $1,000 (or fraction thereof) over the phaseout threshold.
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

/** De minimis: MFJ may claim up to $600 of passive foreign tax without the Form 1116 limitation. */
export const FTC_DE_MINIMIS_MFJ = 600;

/**
 * Foreign Tax Credit (simplified Form 1116, single passive basket).
 * Limitation = (foreign-source income / taxable income) × US income tax (regular + AMT).
 * The FTC cannot offset NIIT or Additional Medicare Tax, so don't include them.
 */
export function computeForeignTaxCredit(
  totalForeignTaxPaid: number,
  foreignSourceIncome: number,
  taxableIncome: number,
  incomeTax: number,
  deMinimisLimit = FTC_DE_MINIMIS_MFJ
): number {
  if (totalForeignTaxPaid <= 0) return 0;
  if (totalForeignTaxPaid <= deMinimisLimit) return Math.min(totalForeignTaxPaid, incomeTax);
  if (foreignSourceIncome <= 0 || taxableIncome <= 0) return 0;

  const ratio = Math.min(1, foreignSourceIncome / taxableIncome);
  const limitation = ratio * incomeTax;
  return Math.min(totalForeignTaxPaid, Math.round(limitation * 100) / 100);
}

/**
 * American Opportunity Tax Credit for one student:
 * 100% of the first $2,000 + 25% of the next $2,000 of qualified expenses,
 * phased out linearly between aotcPhaseoutStart and aotcPhaseoutEnd (MAGI).
 */
export function computeAOTC(
  qualifiedExpenses: number,
  magi: number,
  config: YearConfig
): number {
  if (qualifiedExpenses <= 0) return 0;
  const { aotcMax, aotcPhaseoutStart, aotcPhaseoutEnd } = config.education;
  const base = Math.min(qualifiedExpenses, 2000) + 0.25 * Math.max(0, Math.min(qualifiedExpenses, 4000) - 2000);
  const credit = Math.min(aotcMax, base);
  if (magi <= aotcPhaseoutStart) return credit;
  if (magi >= aotcPhaseoutEnd) return 0;
  const fraction = (magi - aotcPhaseoutStart) / (aotcPhaseoutEnd - aotcPhaseoutStart);
  return Math.round(credit * (1 - fraction) * 100) / 100;
}
