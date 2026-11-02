import type { YearConfig } from './types.js';

// 2026 final values — MFJ.
// Sources: Rev. Proc. 2025-32 (brackets, standard deduction, AMT, CTC), Rev. Proc. 2025-19 (HSA),
// SSA 2026 COLA release (wage base), OBBBA (SALT, AMT phaseout, charitable, itemized limitation, PMI).
export const config2026: YearConfig = {
  year: 2026,
  federalBrackets: [
    { min: 0, max: 24800, rate: 0.10 },
    { min: 24800, max: 100800, rate: 0.12 },
    { min: 100800, max: 211400, rate: 0.22 },
    { min: 211400, max: 403550, rate: 0.24 },
    { min: 403550, max: 512450, rate: 0.32 },
    { min: 512450, max: 768700, rate: 0.35 },
    { min: 768700, max: null, rate: 0.37 },
  ],
  ltcgBrackets: [
    { min: 0, max: 98900, rate: 0.00 },
    { min: 98900, max: 613700, rate: 0.15 },
    { min: 613700, max: null, rate: 0.20 },
  ],
  standardDeduction: 32200,
  capitalLossLimit: 3000,
  amt: {
    exemption: 140200,
    phaseoutStart: 1000000, // OBBBA reset to $1M MFJ
    phaseoutRate: 0.50,     // OBBBA doubled from 25%
    rate26threshold: 244500,
    rate26: 0.26,
    rate28: 0.28,
  },
  niit: {
    threshold: 250000,
    rate: 0.038,
  },
  additionalMedicare: {
    threshold: 250000,
    rate: 0.009,
  },
  socialSecurity: {
    wageBase: 184500,
    employeeRate: 0.062,
    medicareRate: 0.0145,
  },
  childTaxCredit: {
    amount: 2200,
    phaseoutStart: 400000,
    phaseoutRate: 0.05,
  },
  salt: {
    cap: 40400,            // 101% of 2025
    phaseoutStart: 505000, // 101% of 2025
    phaseoutRate: 0.30,
    floor: 10000,
  },
  hsa: {
    selfOnlyLimit: 4400,
    familyLimit: 8750,
    catchUpAge: 55,
    catchUpAmount: 1000,
  },
  charitable: {
    cashAGILimit: 0.60,
    propertyAGILimit: 0.30,
    agiFloorPct: 0.005,       // OBBBA 0.5% AGI floor for itemizers
    nonItemizerCashMax: 2000, // OBBBA, MFJ (cash to public charities; not DAFs)
  },
  itemized: {
    topBracketReductionRate: 2 / 37, // OBBBA §68: caps itemized benefit at 35%
    mortgageInsuranceDeductible: true,
  },
  colorado: {
    flatRate: 0.044,
  },
  education: {
    aotcMax: 2500,
    aotcPhaseoutStart: 160000,
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
