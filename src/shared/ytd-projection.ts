/**
 * Project full-year W-2 values from a payslip's YTD totals.
 *
 * Recurring pay (salary) is extrapolated across the remaining pay periods.
 * Non-recurring pay already received (gross − salary: RSU vests, bonuses) is kept as-is,
 * and future RSU vests are added explicitly. Vests already paid are therefore counted once,
 * via YTD gross. (The "RSU offset" post-tax deduction doesn't affect W-2 boxes.)
 *
 * Withholding on non-recurring pay is assumed to be at supplemental rates
 * (federal: elected rate up to $1M of supplemental wages, 37% above; state: flat rate),
 * which is backed out of YTD withholding before extrapolating the salary portion.
 */

export interface YTDProjectionInput {
  periodsCompleted: number;
  periodsPerYear: number;
  ytdGrossPay: number;
  /** Recurring base pay included in ytdGrossPay */
  ytdSalary: number;
  /** Pre-tax deductions (401k, HSA, medical) — assumed taken from salary each period */
  ytdPreTaxDeductions: number;
  ytdFederalTax: number;
  ytdStateTax: number;
  ytdOasdi: number;
  ytdMedicare: number;
  ytdHsaEmployer: number;
  /** Value of RSU vests still to come this year (not yet on any payslip) */
  remainingRsuVests: number;
  /** Federal supplemental withholding rate on RSUs/bonuses (22% unless elected otherwise) */
  supplementalFederalRate: number;
  /** State withholding rate on RSUs/bonuses */
  supplementalStateRate: number;
  /** Extra federal withholding per paycheck (W-4 line 4c), if changed mid-year */
  extraFederal?: {
    perPaycheck: number;
    /** Paychecks already in YTD that included the extra amount */
    periodsInYTD: number;
    /** Remaining paychecks that will include it */
    futurePeriods: number;
  };
  ssWageBase: number;
  ssRate: number;
  medicareRate: number;
}

export interface YTDProjection {
  wages: number;
  federalWithheld: number;
  socialSecurityWages: number;
  socialSecurityWithheld: number;
  medicareWages: number;
  medicareWithheld: number;
  stateWages: number;
  stateWithheld: number;
  hsaEmployerContribution: number;
}

/** Mandatory 37% federal withholding on supplemental wages over $1M in a year */
const SUPPLEMENTAL_MANDATORY_THRESHOLD = 1_000_000;
const SUPPLEMENTAL_MANDATORY_RATE = 0.37;
/** Employers withhold Additional Medicare Tax on wages over $200k */
const ADDL_MEDICARE_WITHHOLDING_THRESHOLD = 200_000;
const ADDL_MEDICARE_RATE = 0.009;

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Federal withholding on supplemental wages from cumulative `start` to `start + amount`. */
function supplementalFederal(start: number, amount: number, rate: number): number {
  const below = Math.max(0, Math.min(amount, SUPPLEMENTAL_MANDATORY_THRESHOLD - start));
  return below * rate + (amount - below) * SUPPLEMENTAL_MANDATORY_RATE;
}

export function projectYTD(i: YTDProjectionInput): YTDProjection | null {
  if (i.periodsCompleted <= 0 || i.periodsPerYear <= 0) return null;
  const remaining = Math.max(0, i.periodsPerYear - i.periodsCompleted);
  const perPeriod = (ytd: number) => ytd / i.periodsCompleted;

  // Pay
  const ytdNonRecurring = Math.max(0, i.ytdGrossPay - i.ytdSalary);
  const futureSalary = perPeriod(i.ytdSalary) * remaining;
  const futurePreTax = perPeriod(i.ytdPreTaxDeductions) * remaining;
  const futureGross = futureSalary + i.remainingRsuVests;
  const gross = i.ytdGrossPay + futureGross;
  const preTax = i.ytdPreTaxDeductions + futurePreTax;
  const wages = gross - preTax;

  // Federal: split YTD withholding into supplemental (non-recurring) and salary portions
  const ytdFedSupplemental = Math.min(
    i.ytdFederalTax,
    supplementalFederal(0, ytdNonRecurring, i.supplementalFederalRate)
  );
  // Regular salary withholding, excluding any W-4 extra already in YTD
  const extra = i.extraFederal;
  const extraInYTD = extra ? extra.perPaycheck * Math.min(extra.periodsInYTD, i.periodsCompleted) : 0;
  const ytdFedSalary = Math.max(0, i.ytdFederalTax - ytdFedSupplemental - extraInYTD);
  const extraFuture = extra ? extra.perPaycheck * Math.min(extra.futurePeriods, remaining) : 0;
  const federalWithheld =
    i.ytdFederalTax +
    perPeriod(ytdFedSalary) * remaining +
    extraFuture +
    supplementalFederal(ytdNonRecurring, i.remainingRsuVests, i.supplementalFederalRate);

  // State: same split at the flat supplemental rate
  const ytdStateSupplemental = Math.min(i.ytdStateTax, ytdNonRecurring * i.supplementalStateRate);
  const ytdStateSalary = i.ytdStateTax - ytdStateSupplemental;
  const stateWithheld =
    i.ytdStateTax +
    perPeriod(ytdStateSalary) * remaining +
    i.remainingRsuVests * i.supplementalStateRate;

  // Social Security: capped at the wage base
  const ssWages = Math.min(gross, i.ssWageBase);
  const ytdSsWages = Math.min(i.ytdGrossPay, i.ssWageBase);
  const ssWithheld = Math.min(
    i.ssWageBase * i.ssRate,
    i.ytdOasdi + (ssWages - ytdSsWages) * i.ssRate
  );

  // Medicare: 1.45% on everything + 0.9% withheld on wages over $200k
  const addlOver = (w: number) => Math.max(0, w - ADDL_MEDICARE_WITHHOLDING_THRESHOLD);
  const medicareWithheld =
    i.ytdMedicare +
    futureGross * i.medicareRate +
    (addlOver(gross) - addlOver(i.ytdGrossPay)) * ADDL_MEDICARE_RATE;

  return {
    wages: round2(wages),
    federalWithheld: round2(federalWithheld),
    socialSecurityWages: round2(ssWages),
    socialSecurityWithheld: round2(ssWithheld),
    medicareWages: round2(gross),
    medicareWithheld: round2(medicareWithheld),
    stateWages: round2(wages),
    stateWithheld: round2(stateWithheld),
    hsaEmployerContribution: round2(perPeriod(i.ytdHsaEmployer) * i.periodsPerYear),
  };
}
