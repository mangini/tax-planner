import type { YearConfig } from '../../shared/types.js';
import { computeCapitalGainsTax } from './capital-gains.js';

export interface AMTInput {
  taxableIncome: number;
  usingItemized: boolean;
  /** SALT actually deducted on Schedule A (after cap) */
  saltDeducted: number;
  /** §68 itemized reduction (not applied for AMT, so it is backed out) */
  itemizedReduction: number;
  /** Standard deduction claimed (added back when not itemizing) */
  standardDeduction: number;
  /** Taxable state/local refund included in income (subtracted for AMT) */
  stateRefundIncome: number;
  /** Qualified dividends + net capital gain taxed at preferential rates */
  preferentialIncome: number;
  /** Regular-tax ordinary taxable income (used to stack preferential income, as on Form 6251 Part III) */
  ordinaryTaxableIncome: number;
  regularTax: number;
}

function rateTax(base: number, config: YearConfig): number {
  if (base <= 0) return 0;
  const t = config.amt.rate26threshold;
  return base <= t
    ? base * config.amt.rate26
    : t * config.amt.rate26 + (base - t) * config.amt.rate28;
}

/**
 * Alternative Minimum Tax (Form 6251, simplified).
 * AMTI = taxable income + SALT (itemizers) or standard deduction (non-itemizers)
 *        − §68 reduction − taxable state refund.
 * Exemption phases out by phaseoutRate per $1 of AMTI over the threshold.
 * Preferential income keeps its 0/15/20% rates (Part III).
 * Not modeled: ISOs, private activity bond interest, AMT foreign tax credit, depreciation adjustments.
 */
export function computeAMT(input: AMTInput, config: YearConfig): number {
  const addback = input.usingItemized
    ? input.saltDeducted - input.itemizedReduction
    : input.standardDeduction;
  const amti = input.taxableIncome + addback - input.stateRefundIncome;
  if (amti <= 0) return 0;

  let exemption = config.amt.exemption;
  if (amti > config.amt.phaseoutStart) {
    const reduction = (amti - config.amt.phaseoutStart) * config.amt.phaseoutRate;
    exemption = Math.max(0, exemption - reduction);
  }

  const amtBase = Math.max(0, amti - exemption);
  if (amtBase <= 0) return 0;

  const pref = Math.min(Math.max(0, input.preferentialIncome), amtBase);
  let tentativeMinTax = rateTax(amtBase, config);
  if (pref > 0) {
    const withPrefRates =
      rateTax(amtBase - pref, config) +
      computeCapitalGainsTax(pref, 0, input.ordinaryTaxableIncome, config.ltcgBrackets);
    tentativeMinTax = Math.min(tentativeMinTax, withPrefRates);
  }

  return Math.max(0, Math.round((tentativeMinTax - input.regularTax) * 100) / 100);
}
