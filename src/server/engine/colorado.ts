import type { YearConfig, TaxYearData, ColoradoTaxBreakdown } from '../../shared/types.js';
import { amountValue } from '../../shared/types.js';

/**
 * Colorado income tax: flat rate applied to federal taxable income.
 */
export function computeColoradoTax(
  federalTaxableIncome: number,
  data: TaxYearData,
  config: YearConfig
): ColoradoTaxBreakdown {
  const coloradoTaxableIncome = Math.max(0, federalTaxableIncome);
  const coloradoTax = Math.round(coloradoTaxableIncome * config.colorado.flatRate * 100) / 100;

  // Colorado withholding from all W-2s + 1099-Rs
  let coloradoWithholding = 0;
  for (const w of data.w2) coloradoWithholding += amountValue(w.stateWithheld);
  for (const r of data.form1099R) {
    coloradoWithholding += amountValue(r.stateWithheld);
  }

  // Colorado estimated payments
  let coloradoEstimatedPayments = 0;
  if (data.estimatedPayments) {
    coloradoEstimatedPayments =
      amountValue(data.estimatedPayments.stateQ1) +
      amountValue(data.estimatedPayments.stateQ2) +
      amountValue(data.estimatedPayments.stateQ3) +
      amountValue(data.estimatedPayments.stateQ4);
  }

  const coloradoBalanceDue = Math.round(
    (coloradoTax - coloradoWithholding - coloradoEstimatedPayments) * 100
  ) / 100;

  return {
    federalTaxableIncome,
    coloradoTaxableIncome,
    coloradoTax,
    coloradoWithholding,
    coloradoEstimatedPayments,
    coloradoBalanceDue,
  };
}
