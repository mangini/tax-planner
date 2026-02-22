import type { TaxBracket } from '../../shared/types.js';

/**
 * Compute tax through progressive brackets.
 * Returns the total tax and the marginal rate.
 */
export function computeBracketTax(
  income: number,
  brackets: TaxBracket[]
): { tax: number; marginalRate: number } {
  let tax = 0;
  let marginalRate = 0;

  for (const bracket of brackets) {
    if (income <= bracket.min) break;
    const upper = bracket.max !== null ? Math.min(income, bracket.max) : income;
    const taxable = upper - bracket.min;
    tax += taxable * bracket.rate;
    marginalRate = bracket.rate;
  }

  return { tax: Math.round(tax * 100) / 100, marginalRate };
}

/**
 * Compute ordinary income tax (excludes qualified dividends and LTCG).
 */
export function computeOrdinaryIncomeTax(
  ordinaryTaxableIncome: number,
  brackets: TaxBracket[]
): { tax: number; marginalRate: number } {
  return computeBracketTax(Math.max(0, ordinaryTaxableIncome), brackets);
}
