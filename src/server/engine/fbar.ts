import type { TaxYearData, YearConfig, FBARResult } from '../../shared/types.js';
import { amountValue } from '../../shared/types.js';

/**
 * FBAR: Required if aggregate max balance > fbarThreshold at any point during the year.
 * Form 8938 (FATCA): Required if EITHER threshold is met:
 *   - End of year: aggregate year-end balance > form8938YearEnd / form8938YearEndMFJ
 *   - At any time: aggregate max balance > form8938AnyTime / form8938AnyTimeMFJ
 */
export function computeFBAR(data: TaxYearData, config: YearConfig): FBARResult {
  const accounts = data.foreignAccounts.map((a) => ({
    institution: a.institution,
    country: a.country,
    maxValue: amountValue(a.maxValue),
    yearEndValue: amountValue(a.yearEndValue),
  }));

  const aggregateMaxBalance = accounts.reduce((sum, a) => sum + a.maxValue, 0);
  const aggregateYearEndBalance = accounts.reduce((sum, a) => sum + a.yearEndValue, 0);

  const isMFJ = data.filing.status === 'mfj';
  const { fbar } = config;
  const yearEndThreshold = isMFJ ? fbar.form8938YearEndMFJ : fbar.form8938YearEnd;
  const anyTimeThreshold = isMFJ ? fbar.form8938AnyTimeMFJ : fbar.form8938AnyTime;

  return {
    aggregateMaxBalance,
    aggregateYearEndBalance,
    fbarRequired: aggregateMaxBalance > fbar.fbarThreshold,
    form8938Required:
      aggregateYearEndBalance > yearEndThreshold ||
      aggregateMaxBalance > anyTimeThreshold,
    accounts,
  };
}
