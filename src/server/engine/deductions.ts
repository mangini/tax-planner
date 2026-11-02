import type { YearConfig, DeductionBreakdown, TaxYearData } from '../../shared/types.js';
import { amountValue } from '../../shared/types.js';

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Compute deductions: itemized vs standard, SALT cap, charitable limits,
 * and the OBBBA (2026+) itemized-deduction rules.
 */
export function computeDeductions(
  data: TaxYearData,
  agi: number,
  config: YearConfig
): DeductionBreakdown {
  // Mortgage interest — sum across all 1098s
  let mortgageInterest = 0;
  let pmiPaid = 0;
  for (const f of data.form1098) {
    mortgageInterest += amountValue(f.mortgageInterest);
    pmiPaid += amountValue(f.pmi);
  }

  // Mortgage insurance premiums (restored 2026+). Reduced 10% per $1,000 (or fraction) of AGI over $100k.
  let mortgageInsurance = 0;
  if (config.itemized.mortgageInsuranceDeductible && pmiPaid > 0) {
    const steps = agi > 100000 ? Math.ceil((agi - 100000) / 1000) : 0;
    mortgageInsurance = round2(pmiPaid * Math.max(0, 1 - steps * 0.1));
  }

  // Property tax — sum across all 1098s
  let propertyTax = 0;
  for (const f of data.form1098) propertyTax += amountValue(f.propertyTax);

  // State income tax paid during the year: W-2 + 1099-R withholding + estimated payments
  let stateIncomeTax = 0;
  for (const w of data.w2) stateIncomeTax += amountValue(w.stateWithheld);
  for (const r of data.form1099R) stateIncomeTax += amountValue(r.stateWithheld);
  if (data.estimatedPayments) {
    stateIncomeTax +=
      amountValue(data.estimatedPayments.stateQ1) +
      amountValue(data.estimatedPayments.stateQ2) +
      amountValue(data.estimatedPayments.stateQ3) +
      amountValue(data.estimatedPayments.stateQ4);
  }

  // SALT = state income tax + property tax, capped
  const saltTotal = stateIncomeTax + propertyTax;

  // SALT cap, reduced by phaseoutRate × MAGI over threshold, never below floor
  let effectiveCap = config.salt.cap;
  if (config.salt.phaseoutStart !== null && agi > config.salt.phaseoutStart) {
    const excess = agi - config.salt.phaseoutStart;
    const reduction = excess * config.salt.phaseoutRate;
    effectiveCap = Math.max(config.salt.floor, effectiveCap - reduction);
  }
  const saltCapped = Math.min(saltTotal, effectiveCap);

  // Charitable donations with AGI limits
  let cashDonations = 0;
  let propertyDonations = 0;
  if (data.charitable) {
    for (const d of data.charitable.donations) {
      if (d.type === 'cash') cashDonations += amountValue(d.amount);
      else propertyDonations += amountValue(d.amount);
    }
  }
  const cashAllowed = Math.min(cashDonations, agi * config.charitable.cashAGILimit);
  const propertyAllowed = Math.min(propertyDonations, agi * config.charitable.propertyAGILimit);

  // 2026+: only contributions above 0.5% of AGI are deductible (itemizers). Applied to cash first.
  let floorRemaining = Math.max(0, agi * config.charitable.agiFloorPct);
  const charitableCash = round2(Math.max(0, cashAllowed - floorRemaining));
  floorRemaining = Math.max(0, floorRemaining - cashAllowed);
  const charitableProperty = round2(Math.max(0, propertyAllowed - floorRemaining));
  const charitableTotal = charitableCash + charitableProperty;

  // Itemized before the §68 limitation
  const itemizedBeforeLimit = mortgageInterest + mortgageInsurance + saltCapped + charitableTotal;

  // 2026+ §68: reduce by 2/37 × lesser of (itemized, AGI over the start of the top bracket).
  // (taxable income + itemized deductions == AGI here, since there is no QBI deduction modeled.)
  let itemizedReduction = 0;
  if (config.itemized.topBracketReductionRate > 0) {
    const topBracketStart = config.federalBrackets[config.federalBrackets.length - 1].min;
    const overTop = Math.max(0, agi - topBracketStart);
    itemizedReduction = round2(
      config.itemized.topBracketReductionRate * Math.min(itemizedBeforeLimit, overTop)
    );
  }
  const totalItemized = round2(itemizedBeforeLimit - itemizedReduction);

  // Standard deduction (+ 2026+ non-itemizer cash charitable deduction)
  const standardDeduction = config.standardDeduction;
  const nonItemizerCharitable = Math.min(cashDonations, config.charitable.nonItemizerCashMax);
  const standardTotal = standardDeduction + nonItemizerCharitable;

  const usingItemized = totalItemized > standardTotal;
  const deductionUsed = usingItemized ? totalItemized : standardTotal;

  return {
    mortgageInterest,
    mortgageInsurance,
    propertyTax,
    stateIncomeTax,
    saltTotal,
    saltCapped,
    charitableCash,
    charitableProperty,
    charitableTotal,
    itemizedReduction,
    totalItemized,
    standardDeduction,
    nonItemizerCharitable: usingItemized ? 0 : nonItemizerCharitable,
    usingItemized,
    deductionUsed,
  };
}
