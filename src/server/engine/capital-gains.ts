import type { TaxBracket } from '../../shared/types.js';

/**
 * Compute tax on qualified dividends + net long-term capital gains.
 * These are stacked on top of ordinary income for bracket purposes.
 * The brackets represent total income thresholds, so we need to account
 * for the ordinary income that fills the lower brackets first.
 */
export function computeCapitalGainsTax(
  qualifiedDividends: number,
  netLTCG: number,
  ordinaryTaxableIncome: number,
  ltcgBrackets: TaxBracket[]
): number {
  const totalPreferentialIncome = qualifiedDividends + netLTCG;
  if (totalPreferentialIncome <= 0) return 0;

  // The preferential income sits "on top" of ordinary income
  const baseIncome = Math.max(0, ordinaryTaxableIncome);
  let tax = 0;

  for (const bracket of ltcgBrackets) {
    const bracketMax = bracket.max ?? Infinity;
    // How much room is left in this bracket after ordinary income fills it?
    const startInBracket = Math.max(0, bracket.min - baseIncome);
    const endInBracket = Math.max(0, bracketMax - baseIncome);
    const roomInBracket = endInBracket - startInBracket;

    if (roomInBracket <= 0) continue;

    // How much preferential income falls in this bracket?
    const prefIncomeBeforeThisBracket = startInBracket;
    const prefIncomeUpToThisBracket = Math.min(totalPreferentialIncome, startInBracket + roomInBracket);
    const taxableInBracket = Math.max(0, prefIncomeUpToThisBracket - prefIncomeBeforeThisBracket);

    tax += taxableInBracket * bracket.rate;
  }

  return Math.round(tax * 100) / 100;
}
