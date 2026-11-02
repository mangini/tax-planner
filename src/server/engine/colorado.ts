import type { YearConfig, TaxYearData, ColoradoTaxBreakdown } from '../../shared/types.js';
import { amountValue } from '../../shared/types.js';

export interface ColoradoAdjustments {
  /** Federal itemizers: state income tax deducted, up to itemized − standard (Form 104 line 3) */
  stateIncomeTaxAddback: number;
  /** State income tax refund included in federal income (Form 104AD subtraction) */
  stateRefundSubtraction: number;
}

/**
 * Colorado income tax: flat rate applied to federal taxable income
 * plus the state income tax addback, minus the state refund subtraction.
 * Not modeled: high-income itemized/standard deduction addback, QBI addback,
 * pension/US-obligation subtractions.
 */
export function computeColoradoTax(
  federalTaxableIncome: number,
  data: TaxYearData,
  config: YearConfig,
  adj: ColoradoAdjustments = { stateIncomeTaxAddback: 0, stateRefundSubtraction: 0 }
): ColoradoTaxBreakdown {
  const coloradoTaxableIncome = Math.max(
    0,
    federalTaxableIncome + adj.stateIncomeTaxAddback - adj.stateRefundSubtraction
  );
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
    stateIncomeTaxAddback: adj.stateIncomeTaxAddback,
    stateRefundSubtraction: adj.stateRefundSubtraction,
    coloradoTaxableIncome,
    coloradoTax,
    coloradoWithholding,
    coloradoEstimatedPayments,
    coloradoBalanceDue,
  };
}
