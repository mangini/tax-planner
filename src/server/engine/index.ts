import type {
  TaxYearData,
  YearConfig,
  ComputationResult,
  FederalTaxBreakdown,
  EstimateWarning,
} from '../../shared/types.js';
import { amountValue } from '../../shared/types.js';
import { computeOrdinaryIncomeTax } from './federal-income.js';
import { computeCapitalGainsTax } from './capital-gains.js';
import { computeAMT } from './amt.js';
import { computeNIIT } from './niit.js';
import { computeAdditionalMedicareTax } from './medicare.js';
import { computeDeductions } from './deductions.js';
import { computeHSADeduction } from './hsa.js';
import { computeChildTaxCredit, computeForeignTaxCredit } from './credits.js';
import { computeColoradoTax } from './colorado.js';
import { computeFBAR } from './fbar.js';

// ─── Helper to collect estimate warnings ───

function collectEstimates(data: TaxYearData): EstimateWarning[] {
  const warnings: EstimateWarning[] = [];

  for (const w of data.w2) {
    if (w.isEstimate) warnings.push({ form: `W-2 (${w.employer || 'unnamed'})` });
  }
  for (const f of data.form1099INT) {
    if (f.isEstimate) warnings.push({ form: `1099-INT (${f.payer || 'unnamed'})` });
  }
  for (const f of data.form1099DIV) {
    if (f.isEstimate) warnings.push({ form: `1099-DIV (${f.payer || 'unnamed'})` });
  }
  for (const f of data.form1099B) {
    if (f.isEstimate) warnings.push({ form: `1099-B (${f.broker || 'unnamed'})` });
  }
  for (const f of data.form1099G) {
    if (f.isEstimate) warnings.push({ form: `1099-G (${f.state || 'unnamed'})` });
  }
  for (const f of data.form1099R) {
    if (f.isEstimate) warnings.push({ form: `1099-R (${f.payer || 'unnamed'})` });
  }
  for (const f of data.form1098) {
    if (f.isEstimate) warnings.push({ form: `1098 (${f.lender || 'unnamed'})` });
  }
  for (const k of data.scheduleK1) {
    if (k.isEstimate) warnings.push({ form: `K-1 (${k.partnershipName || k.ein || 'unnamed'})` });
  }
  if (data.foreignRentalIncome?.isEstimate) {
    warnings.push({ form: 'Foreign Rental' });
  }
  if (data.foreignBankIncome?.isEstimate) {
    warnings.push({ form: 'Foreign Bank' });
  }
  if (data.hsa?.isEstimate) {
    warnings.push({ form: 'HSA' });
  }
  if (data.charitable?.isEstimate) {
    warnings.push({ form: 'Charitable' });
  }

  return warnings;
}

// ─── Main computation ───

export function computeTax(data: TaxYearData, config: YearConfig): ComputationResult {
  // 1. Aggregate income by category
  let wageIncome = 0;
  for (const w of data.w2) wageIncome += amountValue(w.wages);

  let interestIncome = 0;
  for (const f of data.form1099INT) interestIncome += amountValue(f.interest);
  for (const k of data.scheduleK1) interestIncome += amountValue(k.interestIncome);
  if (data.foreignBankIncome) interestIncome += amountValue(data.foreignBankIncome.interestIncome);

  let ordinaryDividendIncome = 0;
  let qualifiedDividendIncome = 0;
  for (const f of data.form1099DIV) {
    ordinaryDividendIncome += amountValue(f.ordinaryDividends);
    qualifiedDividendIncome += amountValue(f.qualifiedDividends);
  }
  for (const k of data.scheduleK1) {
    ordinaryDividendIncome += amountValue(k.ordinaryDividends);
    qualifiedDividendIncome += amountValue(k.qualifiedDividends);
  }
  if (data.foreignBankIncome) {
    ordinaryDividendIncome += amountValue(data.foreignBankIncome.dividendIncome);
  }

  // Capital gains from 1099-B (now an array)
  let shortTermCapitalGain = 0;
  let longTermCapitalGain = 0;
  for (const b of data.form1099B) {
    shortTermCapitalGain += amountValue(b.shortTermProceeds) - amountValue(b.shortTermBasis);
    longTermCapitalGain += amountValue(b.longTermProceeds) - amountValue(b.longTermBasis);
  }
  // Cap gain distributions from 1099-DIV are long-term
  for (const f of data.form1099DIV) {
    longTermCapitalGain += amountValue(f.capitalGainDistributions);
  }
  // K-1 capital gains
  for (const k of data.scheduleK1) {
    shortTermCapitalGain += amountValue(k.shortTermCapitalGain);
    longTermCapitalGain += amountValue(k.longTermCapitalGain);
  }
  // Foreign bank capital gains
  if (data.foreignBankIncome) {
    longTermCapitalGain += amountValue(data.foreignBankIncome.capitalGains);
  }

  // K-1 ordinary + rental
  let k1OrdinaryIncome = 0;
  let k1RentalIncome = 0;
  for (const k of data.scheduleK1) {
    k1OrdinaryIncome += amountValue(k.ordinaryIncome);
    k1RentalIncome += amountValue(k.rentalIncome);
  }

  // Foreign rental
  const foreignRentalIncome = data.foreignRentalIncome
    ? amountValue(data.foreignRentalIncome.netIncome)
    : 0;

  // State refund (taxable only if prior year itemized) — sum across all 1099-G
  let stateRefundIncome = 0;
  for (const g of data.form1099G) {
    if (g.priorYearItemized) stateRefundIncome += amountValue(g.stateRefund);
  }

  // Retirement distributions
  let retirementIncome = 0;
  for (const r of data.form1099R) {
    retirementIncome += amountValue(r.taxableAmount);
  }

  // Total gross income
  const grossIncome =
    wageIncome +
    interestIncome +
    ordinaryDividendIncome +
    shortTermCapitalGain +
    longTermCapitalGain +
    k1OrdinaryIncome +
    k1RentalIncome +
    foreignRentalIncome +
    stateRefundIncome +
    retirementIncome;

  // 2. Above-the-line deductions
  const hsaDeduction = computeHSADeduction(data, config);

  // 3. AGI
  const agi = grossIncome - hsaDeduction;

  // 4. Deductions
  const deductions = computeDeductions(data, agi, config);

  // 5. Taxable income
  const taxableIncome = Math.max(0, agi - deductions.deductionUsed);

  // 6. Split income for tax computation
  const netLTCG = Math.max(0, longTermCapitalGain);
  const preferentialIncome = qualifiedDividendIncome + netLTCG;
  const ordinaryTaxableIncome = Math.max(0, taxableIncome - preferentialIncome);

  // 7. Ordinary income tax
  const { tax: ordinaryTax, marginalRate } = computeOrdinaryIncomeTax(
    ordinaryTaxableIncome,
    config.federalBrackets
  );

  // 8. Capital gains tax (stacked on top of ordinary income)
  const capitalGainsTax = computeCapitalGainsTax(
    qualifiedDividendIncome,
    netLTCG,
    ordinaryTaxableIncome,
    config.ltcgBrackets
  );

  // Regular tax before AMT
  const regularTax = ordinaryTax + capitalGainsTax;

  // 9. AMT
  const amt = computeAMT(
    taxableIncome,
    deductions.saltCapped,
    deductions.usingItemized,
    regularTax,
    config
  );

  // 10. Investment income for NIIT
  const investmentIncome =
    interestIncome +
    ordinaryDividendIncome +
    shortTermCapitalGain +
    longTermCapitalGain +
    k1RentalIncome +
    foreignRentalIncome;

  const niit = computeNIIT(investmentIncome, agi, config);

  // 11. Additional Medicare
  const additionalMedicareTax = computeAdditionalMedicareTax(wageIncome, config);

  // Total tax before credits
  const totalTaxBeforeCredits = regularTax + amt + niit + additionalMedicareTax;

  // 12. Credits
  const childTaxCredit = computeChildTaxCredit(
    data.filing.numChildren,
    agi,
    config
  );

  // Foreign tax credit
  let totalForeignTaxPaid = 0;
  let foreignSourceIncome = 0;
  for (const f of data.form1099INT) {
    if (f.isForeign) {
      totalForeignTaxPaid += amountValue(f.foreignTaxPaid);
      foreignSourceIncome += amountValue(f.interest);
    }
  }
  for (const f of data.form1099DIV) {
    totalForeignTaxPaid += amountValue(f.foreignTaxPaid);
    if (amountValue(f.foreignTaxPaid) > 0) {
      foreignSourceIncome += amountValue(f.ordinaryDividends);
    }
  }
  for (const k of data.scheduleK1) {
    totalForeignTaxPaid += amountValue(k.foreignTaxPaid);
    if (amountValue(k.foreignTaxPaid) > 0) {
      foreignSourceIncome +=
        amountValue(k.interestIncome) +
        amountValue(k.ordinaryDividends) +
        amountValue(k.longTermCapitalGain);
    }
  }
  if (data.foreignRentalIncome) {
    totalForeignTaxPaid += amountValue(data.foreignRentalIncome.foreignTaxPaid);
    foreignSourceIncome += amountValue(data.foreignRentalIncome.netIncome);
  }
  if (data.foreignBankIncome) {
    totalForeignTaxPaid += amountValue(data.foreignBankIncome.foreignTaxPaid);
    foreignSourceIncome +=
      amountValue(data.foreignBankIncome.interestIncome) +
      amountValue(data.foreignBankIncome.dividendIncome) +
      amountValue(data.foreignBankIncome.capitalGains);
  }

  const foreignTaxCredit = computeForeignTaxCredit(
    totalForeignTaxPaid,
    foreignSourceIncome,
    grossIncome,
    totalTaxBeforeCredits
  );

  const totalCredits = childTaxCredit + foreignTaxCredit;

  // Total federal tax
  const totalTax = Math.max(0, totalTaxBeforeCredits - totalCredits);

  // Withholding — sum from all W-2s and 1099-Rs
  let totalWithholding = 0;
  for (const w of data.w2) totalWithholding += amountValue(w.federalWithheld);
  for (const r of data.form1099R) totalWithholding += amountValue(r.federalWithheld);

  // Estimated payments
  let totalEstimatedPayments = 0;
  if (data.estimatedPayments) {
    totalEstimatedPayments =
      amountValue(data.estimatedPayments.federalQ1) +
      amountValue(data.estimatedPayments.federalQ2) +
      amountValue(data.estimatedPayments.federalQ3) +
      amountValue(data.estimatedPayments.federalQ4);
  }

  const balanceDue = Math.round((totalTax - totalWithholding - totalEstimatedPayments) * 100) / 100;
  const effectiveRate = grossIncome > 0 ? totalTax / grossIncome : 0;

  const federal: FederalTaxBreakdown = {
    grossIncome,
    wageIncome,
    interestIncome,
    ordinaryDividendIncome,
    qualifiedDividendIncome,
    shortTermCapitalGain,
    longTermCapitalGain,
    k1OrdinaryIncome,
    k1RentalIncome,
    foreignRentalIncome,
    otherIncome: 0,
    stateRefundIncome,
    retirementIncome,
    hsaDeduction,
    agi,
    deductions,
    taxableIncome,
    ordinaryTax,
    capitalGainsTax,
    amt,
    niit,
    additionalMedicareTax,
    totalTaxBeforeCredits,
    childTaxCredit,
    foreignTaxCredit,
    totalCredits,
    totalTax,
    totalWithholding,
    totalEstimatedPayments,
    balanceDue,
    effectiveRate: Math.round(effectiveRate * 10000) / 10000,
    marginalRate,
  };

  // Colorado
  const colorado = computeColoradoTax(taxableIncome, data, config);

  // FBAR
  const fbar = computeFBAR(data, config);

  // Estimate warnings
  const estimateWarnings = collectEstimates(data);

  return { federal, colorado, fbar, estimateWarnings };
}
