import type { YearConfig, DeductionBreakdown, TaxYearData } from '../../shared/types.js';
import { amountValue } from '../../shared/types.js';

/**
 * Compute deductions: itemized vs standard, SALT cap, charitable limits.
 */
export function computeDeductions(
  data: TaxYearData,
  agi: number,
  config: YearConfig
): DeductionBreakdown {
  // Mortgage interest — sum across all 1098s
  let mortgageInterest = 0;
  for (const f of data.form1098) mortgageInterest += amountValue(f.mortgageInterest);

  // Property tax — sum across all 1098s
  let propertyTax = 0;
  for (const f of data.form1098) propertyTax += amountValue(f.propertyTax);

  // State income tax (from all W-2 withholdings + estimated payments)
  let stateIncomeTax = 0;
  for (const w of data.w2) stateIncomeTax += amountValue(w.stateWithheld);
  if (data.estimatedPayments) {
    stateIncomeTax +=
      amountValue(data.estimatedPayments.stateQ1) +
      amountValue(data.estimatedPayments.stateQ2) +
      amountValue(data.estimatedPayments.stateQ3) +
      amountValue(data.estimatedPayments.stateQ4);
  }

  // SALT = state income tax + property tax, capped
  const saltTotal = stateIncomeTax + propertyTax;

  // SALT cap with OBBBA phaseout for high earners
  let effectiveCap = config.salt.cap;
  if (config.salt.phaseoutStart !== null && agi > config.salt.phaseoutStart) {
    const excess = agi - config.salt.phaseoutStart;
    const reduction = excess * config.salt.phaseoutRate;
    effectiveCap = Math.max(config.salt.floor, effectiveCap - reduction);
  }
  const saltCapped = Math.min(saltTotal, effectiveCap);

  // Charitable donations with AGI limits
  const cashDonations = data.charitable ? amountValue(data.charitable.cashDonations) : 0;
  const propertyDonations = data.charitable ? amountValue(data.charitable.propertyDonations) : 0;
  const charitableCash = Math.min(cashDonations, agi * config.charitable.cashAGILimit);
  const charitableProperty = Math.min(propertyDonations, agi * config.charitable.propertyAGILimit);
  const charitableTotal = charitableCash + charitableProperty;

  // Total itemized
  const totalItemized = mortgageInterest + saltCapped + charitableTotal;

  // Standard vs itemized
  const standardDeduction = config.standardDeduction;
  const usingItemized = totalItemized > standardDeduction;
  const deductionUsed = usingItemized ? totalItemized : standardDeduction;

  return {
    mortgageInterest,
    propertyTax,
    saltTotal,
    saltCapped,
    charitableCash,
    charitableProperty,
    charitableTotal,
    totalItemized,
    standardDeduction,
    usingItemized,
    deductionUsed,
  };
}
