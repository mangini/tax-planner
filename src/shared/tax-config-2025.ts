import type { YearConfig } from './types.js';

// 2025 final values — MFJ.
// Sources: Rev. Proc. 2024-40, as modified by the One Big Beautiful Bill Act (OBBBA, P.L. 119-21)
// for the standard deduction, child tax credit and SALT cap.
export const config2025: YearConfig = {
  year: 2025,
  federalBrackets: [
    { min: 0, max: 23850, rate: 0.10 },
    { min: 23850, max: 96950, rate: 0.12 },
    { min: 96950, max: 206700, rate: 0.22 },
    { min: 206700, max: 394600, rate: 0.24 },
    { min: 394600, max: 501050, rate: 0.32 },
    { min: 501050, max: 751600, rate: 0.35 },
    { min: 751600, max: null, rate: 0.37 },
  ],
  ltcgBrackets: [
    { min: 0, max: 96700, rate: 0.00 },
    { min: 96700, max: 600050, rate: 0.15 },
    { min: 600050, max: null, rate: 0.20 },
  ],
  standardDeduction: 31500, // OBBBA raised from $30,000
  capitalLossLimit: 3000,
  amt: {
    exemption: 137000,
    phaseoutStart: 1252700,
    phaseoutRate: 0.25,
    rate26threshold: 239100,
    rate26: 0.26,
    rate28: 0.28,
  },
  niit: {
    threshold: 250000, // statutory, not indexed
    rate: 0.038,
  },
  additionalMedicare: {
    threshold: 250000, // statutory, not indexed
    rate: 0.009,
  },
  socialSecurity: {
    wageBase: 176100,
    employeeRate: 0.062,
    medicareRate: 0.0145,
  },
  childTaxCredit: {
    amount: 2200, // OBBBA
    phaseoutStart: 400000,
    phaseoutRate: 0.05, // $50 per $1,000 (or fraction) over
  },
  salt: {
    cap: 40000,            // OBBBA
    phaseoutStart: 500000, // MAGI threshold (same for single and MFJ)
    phaseoutRate: 0.30,    // cap reduced by 30% of MAGI over threshold
    floor: 10000,
  },
  hsa: {
    selfOnlyLimit: 4300,
    familyLimit: 8550,
    catchUpAge: 55,
    catchUpAmount: 1000,
  },
  charitable: {
    cashAGILimit: 0.60,
    propertyAGILimit: 0.30,
    agiFloorPct: 0,
    nonItemizerCashMax: 0,
  },
  itemized: {
    topBracketReductionRate: 0,
    mortgageInsuranceDeductible: false,
  },
  colorado: {
    flatRate: 0.044, // no TABOR temporary reduction triggered for 2025
  },
  education: {
    aotcMax: 2500,
    aotcPhaseoutStart: 160000, // statutory, not indexed
    aotcPhaseoutEnd: 180000,
  },
  estimatedTax: {
    // Federal: 90% current year or 100%/110% prior year (IRC §6654)
    federal: {
      currentYearPct: 0.90,
      priorYearPct: 1.00,
      priorYearHighIncomePct: 1.10,
      highIncomeAgi: 150000,
      minimumBalanceDue: 1000,
      penaltyRate: 0.07, // IRS underpayment rate (7% through Q4 2026; reset quarterly)
    },
    // Colorado: 70% current year or 100%/110% prior year (DR 0104EP / DR 0204)
    colorado: {
      currentYearPct: 0.70,
      priorYearPct: 1.00,
      priorYearHighIncomePct: 1.10,
      highIncomeAgi: 150000,
      minimumBalanceDue: 1000,
      penaltyRate: 0.11, // approximate — verify against DR 0204 for the year
    },
  },
  fbar: {
    fbarThreshold: 10000,
    form8938YearEnd: 50000,
    form8938YearEndMFJ: 100000,
    form8938AnyTime: 75000,
    form8938AnyTimeMFJ: 150000,
  },
};
