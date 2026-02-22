import type { YearConfig } from '../../shared/types.js';

/**
 * Compute Alternative Minimum Tax.
 * AMTI = taxable income + SALT deduction addback (if itemizing)
 * AMT exemption phases out at 25 cents per dollar over phaseout threshold.
 */
export function computeAMT(
  taxableIncome: number,
  saltDeducted: number,
  usingItemized: boolean,
  regularTax: number,
  config: YearConfig
): number {
  // AMTI adds back SALT deduction if itemizing
  const saltAddback = usingItemized ? saltDeducted : 0;
  const amti = taxableIncome + saltAddback;

  if (amti <= 0) return 0;

  // Compute exemption with phaseout
  let exemption = config.amt.exemption;
  if (amti > config.amt.phaseoutStart) {
    const excess = amti - config.amt.phaseoutStart;
    const reduction = excess * 0.25;
    exemption = Math.max(0, exemption - reduction);
  }

  const amtBase = Math.max(0, amti - exemption);
  if (amtBase <= 0) return 0;

  // 26% up to threshold, 28% above
  let tentativeMinTax: number;
  if (amtBase <= config.amt.rate26threshold) {
    tentativeMinTax = amtBase * config.amt.rate26;
  } else {
    tentativeMinTax =
      config.amt.rate26threshold * config.amt.rate26 +
      (amtBase - config.amt.rate26threshold) * config.amt.rate28;
  }

  // AMT is the excess of tentative minimum tax over regular tax
  return Math.max(0, Math.round((tentativeMinTax - regularTax) * 100) / 100);
}
