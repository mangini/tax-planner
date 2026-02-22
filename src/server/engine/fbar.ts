import type { TaxYearData, FBARResult } from '../../shared/types.js';
import { amountValue } from '../../shared/types.js';

/**
 * FBAR: Required if aggregate max balance > $10,000 at any point during the year.
 * Form 8938 (FATCA): Required if aggregate max exceeds $50,000 single / $100,000 MFJ end of year
 * (or $75,000 / $150,000 at any time during the year — we use end-of-year thresholds).
 */
export function computeFBAR(data: TaxYearData): FBARResult {
  const accounts = data.foreignAccounts.map((a) => ({
    institution: a.institution,
    country: a.country,
    maxValue: amountValue(a.maxValue),
  }));

  const aggregateMaxBalance = accounts.reduce((sum, a) => sum + a.maxValue, 0);

  const isMFJ = data.filing.status === 'mfj';
  const form8938Threshold = isMFJ ? 100000 : 50000;

  return {
    aggregateMaxBalance,
    fbarRequired: aggregateMaxBalance > 10000,
    form8938Required: aggregateMaxBalance > form8938Threshold,
    accounts,
  };
}
