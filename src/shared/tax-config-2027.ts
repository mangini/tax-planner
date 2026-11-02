import type { YearConfig } from './types.js';

// 2027 values — MFJ. MIXED: some official, some projected.
//
// OFFICIAL (as of Nov 2026):
//   - Social Security wage base $192,300 (SSA, Oct 14 2026)
//   - HSA limits $4,500 / $9,000 (Rev. Proc. 2026-24)
//   - Statutory amounts: SALT cap/threshold (101% of 2026), NIIT, Additional Medicare,
//     CTC phaseout, AOTC phaseout, FBAR/8938, AMT phaseout rate, charitable rules
//
// PROJECTED — replace when the IRS publishes the 2027 inflation Rev. Proc. (expected Nov 2026):
//   - Federal brackets, standard deduction: Bloomberg Tax projection (~3.2% C-CPI-U)
//     where published, otherwise 2026 × 1.032 rounded down
//   - LTCG thresholds, AMT exemption/phaseout/28% breakpoint: 2026 × 1.032 rounded down
//   - Child tax credit: held at $2,200 (could index to $2,300)
//   - Colorado rate: assumed 4.40% (TABOR temporary reduction not assumed)
export const config2027: YearConfig = {
  year: 2027,
  federalBrackets: [
    { min: 0, max: 25600, rate: 0.10 },
    { min: 25600, max: 104000, rate: 0.12 },
    { min: 104000, max: 218250, rate: 0.22 },
    { min: 218250, max: 416450, rate: 0.24 },
    { min: 416450, max: 528850, rate: 0.32 },
    { min: 528850, max: 793650, rate: 0.35 },
    { min: 793650, max: null, rate: 0.37 },
  ],
  ltcgBrackets: [
    { min: 0, max: 102050, rate: 0.00 },
    { min: 102050, max: 633300, rate: 0.15 },
    { min: 633300, max: null, rate: 0.20 },
  ],
  standardDeduction: 33200,
  capitalLossLimit: 3000,
  amt: {
    exemption: 144600,
    phaseoutStart: 1032000,
    phaseoutRate: 0.50,
    rate26threshold: 252300,
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
    wageBase: 192300,
    employeeRate: 0.062,
    medicareRate: 0.0145,
  },
  childTaxCredit: {
    amount: 2200,
    phaseoutStart: 400000,
    phaseoutRate: 0.05,
  },
  salt: {
    cap: 40804,            // 101% of 2026
    phaseoutStart: 510050, // 101% of 2026
    phaseoutRate: 0.30,
    floor: 10000,
  },
  hsa: {
    selfOnlyLimit: 4500,
    familyLimit: 9000,
    catchUpAge: 55,
    catchUpAmount: 1000,
  },
  charitable: {
    cashAGILimit: 0.60,
    propertyAGILimit: 0.30,
    agiFloorPct: 0.005,
    nonItemizerCashMax: 2000,
  },
  itemized: {
    topBracketReductionRate: 2 / 37,
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
  fbar: {
    fbarThreshold: 10000,
    form8938YearEnd: 50000,
    form8938YearEndMFJ: 100000,
    form8938AnyTime: 75000,
    form8938AnyTimeMFJ: 150000,
  },
};
