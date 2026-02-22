import type { YearConfig } from './types.js';

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
  standardDeduction: 30000,
  amt: {
    exemption: 133300,
    phaseoutStart: 1218700,
    rate26threshold: 248300,
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
    wageBase: 176100,
    employeeRate: 0.062,
    medicareRate: 0.0145,
  },
  childTaxCredit: {
    amount: 2000,
    phaseoutStart: 400000,
    phaseoutRate: 0.05,
  },
  salt: {
    cap: 40000,           // OBBBA raised for MFJ
    phaseoutStart: 1000000, // Phaseout for high earners
    phaseoutRate: 0.01,
    floor: 10000,          // Minimum SALT cap
  },
  hsa: {
    selfOnlyLimit: 4300,
    familyLimit: 8750,
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
    aotcPhaseoutStart: 160000,
    aotcPhaseoutEnd: 180000,
  },
};
