import type { YearConfig } from './types.js';

// 2026 estimated values — will be updated when IRS publishes final numbers
export const config2026: YearConfig = {
  year: 2026,
  federalBrackets: [
    { min: 0, max: 24500, rate: 0.10 },
    { min: 24500, max: 99600, rate: 0.12 },
    { min: 99600, max: 212350, rate: 0.22 },
    { min: 212350, max: 405550, rate: 0.24 },
    { min: 405550, max: 514700, rate: 0.32 },
    { min: 514700, max: 771800, rate: 0.35 },
    { min: 771800, max: null, rate: 0.37 },
  ],
  ltcgBrackets: [
    { min: 0, max: 99350, rate: 0.00 },
    { min: 99350, max: 616400, rate: 0.15 },
    { min: 616400, max: null, rate: 0.20 },
  ],
  standardDeduction: 30800,
  amt: {
    exemption: 137000,
    phaseoutStart: 1252200,
    rate26threshold: 255200,
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
    wageBase: 181200,
    employeeRate: 0.062,
    medicareRate: 0.0145,
  },
  childTaxCredit: {
    amount: 2000,
    phaseoutStart: 400000,
    phaseoutRate: 0.05,
  },
  salt: {
    cap: 41000,
    phaseoutStart: 1030000,
    phaseoutRate: 0.01,
    floor: 10000,
  },
  hsa: {
    selfOnlyLimit: 4400,
    familyLimit: 8950,
    catchUpAge: 55,
    catchUpAmount: 1000,
  },
  charitable: {
    cashAGILimit: 0.60,
    propertyAGILimit: 0.30,
  },
  colorado: {
    flatRate: 0.044,
  },
  education: {
    aotcMax: 2500,
    aotcPhaseoutStart: 164000,
    aotcPhaseoutEnd: 184000,
  },
  fbar: {
    fbarThreshold: 10000,
    form8938YearEnd: 50000,
    form8938YearEndMFJ: 100000,
    form8938AnyTime: 75000,
    form8938AnyTimeMFJ: 150000,
  },
};
