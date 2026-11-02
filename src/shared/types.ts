// ─── TaxAmount: a number or an estimate ───
export type TaxAmount = number | { value: number; isEstimate: true };

export function amountValue(a: TaxAmount | undefined | null): number {
  if (a == null) return 0;
  return typeof a === 'number' ? a : a.value;
}

export function isEstimate(a: TaxAmount | undefined | null): boolean {
  if (a == null) return false;
  return typeof a !== 'number' && a.isEstimate === true;
}

// ─── Common ───

export type FormOwner = 'self' | 'spouse' | 'joint';

// ─── Form Data Structures ───

export interface W2Data {
  id: string;
  owner: FormOwner;
  employer: string;
  isEstimate?: boolean;
  wages: TaxAmount;
  federalWithheld: TaxAmount;
  socialSecurityWages: TaxAmount;
  socialSecurityWithheld: TaxAmount;
  medicareWages: TaxAmount;
  medicareWithheld: TaxAmount;
  stateWages: TaxAmount;
  stateWithheld: TaxAmount;
  hsaEmployerContribution: TaxAmount;
  /** Set when values were projected with the YTD estimator */
  ytdProjection?: W2YTDProjectionInfo;
  /** Saved YTD estimator inputs, so the projection can be revisited and corrected */
  ytdEstimator?: YTDEstimatorInputs;
}

export interface YTDEstimatorVest {
  date: string;   // YYYY-MM-DD
  shares: number;
  price: number;
}

export interface YTDEstimatorInputs {
  payPeriodEnd: string; // YYYY-MM-DD, from the payslip
  payFrequency: 'weekly' | 'biweekly' | 'semimonthly' | 'monthly';
  ytdGrossPay: number;
  ytdSalary: number;
  ytdPreTaxDeductions: number;
  ytdFederalTax: number;
  ytdStateTax: number;
  ytdOasdi: number;
  ytdMedicare: number;
  ytdHsa: number;
  supplementalFederalRate: number;
  /** Upcoming vests; ignored while rsuFromGrants is true (derived live from RSU Grants) */
  rsuVests: YTDEstimatorVest[];
  rsuFromGrants: boolean;
}

export interface W2YTDProjectionInfo {
  /** Pay period end date of the payslip used (YYYY-MM-DD) */
  asOf: string;
  payFrequency: 'weekly' | 'biweekly' | 'semimonthly' | 'monthly';
  /** Value of RSU vests after asOf that were included in the projection */
  remainingRsuVests: number;
}

export interface Form1099INTData {
  id: string;
  owner: FormOwner;
  payer: string;
  isEstimate?: boolean;
  interest: TaxAmount;
  isForeign: boolean;
  foreignTaxPaid: TaxAmount;
  country?: string;
}

export interface Form1099DIVData {
  id: string;
  owner: FormOwner;
  payer: string;
  isEstimate?: boolean;
  ordinaryDividends: TaxAmount;
  qualifiedDividends: TaxAmount;
  capitalGainDistributions: TaxAmount;
  foreignTaxPaid: TaxAmount;
  country?: string;
}

export interface Form1099BData {
  id: string;
  owner: FormOwner;
  broker: string;
  isEstimate?: boolean;
  shortTermProceeds: TaxAmount;
  shortTermBasis: TaxAmount;
  longTermProceeds: TaxAmount;
  longTermBasis: TaxAmount;
}

export interface Form1099GData {
  id: string;
  owner: FormOwner;
  state: string;
  isEstimate?: boolean;
  stateRefund: TaxAmount;
  priorYearItemized: boolean;
}

export interface Form1099RData {
  id: string;
  owner: FormOwner;
  payer: string;
  isEstimate?: boolean;
  grossDistribution: TaxAmount;
  taxableAmount: TaxAmount;
  federalWithheld: TaxAmount;
  stateWithheld: TaxAmount;
}

export interface Form1098Data {
  id: string;
  lender: string;
  isEstimate?: boolean;
  mortgageInterest: TaxAmount;
  propertyTax: TaxAmount;
  pmi: TaxAmount;
}

export interface ScheduleK1Data {
  id: string;
  owner: FormOwner;
  partnershipName: string;
  ein: string;
  isEstimate?: boolean;
  ordinaryIncome: TaxAmount;
  rentalIncome: TaxAmount;
  interestIncome: TaxAmount;
  ordinaryDividends: TaxAmount;
  qualifiedDividends: TaxAmount;
  shortTermCapitalGain: TaxAmount;
  longTermCapitalGain: TaxAmount;
  section199A: TaxAmount;
  foreignTaxPaid: TaxAmount;
  selfEmploymentEarnings: TaxAmount;
}

export interface ForeignRentalIncomeData {
  country: string;
  isEstimate?: boolean;
  grossIncome: TaxAmount;
  expenses: TaxAmount;
  netIncome: TaxAmount;
  foreignTaxPaid: TaxAmount;
}

export interface ForeignBankIncomeData {
  country: string;
  isEstimate?: boolean;
  interestIncome: TaxAmount;
  dividendIncome: TaxAmount;
  capitalGains: TaxAmount;
  foreignTaxPaid: TaxAmount;
}

export interface HSAData {
  isEstimate?: boolean;
  selfContribution: TaxAmount;
  employerContribution: TaxAmount;
  coverageType: 'self-only' | 'family';
  selfAge: number;
  spouseAge: number;
}

export interface CharitableDonation {
  description: string;
  amount: TaxAmount;
  type: 'cash' | 'property';
}

export interface CharitableData {
  isEstimate?: boolean;
  donations: CharitableDonation[];
}

export interface ForeignAccountData {
  id: string;
  owner: FormOwner;
  institution: string;
  country: string;
  accountType: 'deposit' | 'securities' | 'other';
  maxValue: TaxAmount;
  yearEndValue: TaxAmount;
  isClosed: boolean;
}

export interface EducationCreditsData {
  enabled: boolean;
  institution?: string;
  tuitionPaid?: TaxAmount;
  scholarships?: TaxAmount;
}

export interface PriorYearTaxData {
  /** Federal total tax, Form 1040 line 24 */
  federalTotalTax: number;
  /** Federal AGI, Form 1040 line 11 */
  federalAgi: number;
  /** Colorado net tax, DR 0104 */
  coloradoNetTax: number;
}

export interface EstimatedPaymentsData {
  /** Prior-year amounts from the filed return, for safe-harbor calculations */
  priorYear?: PriorYearTaxData;
  federalQ1: TaxAmount;
  federalQ2: TaxAmount;
  federalQ3: TaxAmount;
  federalQ4: TaxAmount;
  stateQ1: TaxAmount;
  stateQ2: TaxAmount;
  stateQ3: TaxAmount;
  stateQ4: TaxAmount;
}

// ─── RSU grants ───

export interface RSUVest {
  date: string; // YYYY-MM-DD
  shares: number;
}

export interface RSUGrant {
  id: string;
  owner: FormOwner;
  company: string;
  grantName: string;
  grantDate: string; // YYYY-MM-DD, '' if unknown
  vests: RSUVest[];
  source: 'morgan-stanley' | 'manual';
}

export interface FilingData {
  status: 'single' | 'mfj' | 'mfs' | 'hoh';
  numChildren: number;
}

// ─── Full Tax Year Data ───

export interface TaxYearData {
  year: number;
  filing: FilingData;
  w2: W2Data[];
  form1099INT: Form1099INTData[];
  form1099DIV: Form1099DIVData[];
  form1099B: Form1099BData[];
  form1099G: Form1099GData[];
  form1099R: Form1099RData[];
  form1098: Form1098Data[];
  scheduleK1: ScheduleK1Data[];
  foreignRentalIncome?: ForeignRentalIncomeData;
  foreignBankIncome?: ForeignBankIncomeData;
  hsa?: HSAData;
  charitable?: CharitableData;
  foreignAccounts: ForeignAccountData[];
  educationCredits?: EducationCreditsData;
  estimatedPayments?: EstimatedPaymentsData;
  rsuGrants?: RSUGrant[];
  /** Assumed share price per company name, for valuing vests this year */
  rsuPrices?: Record<string, number>;
  checklistChecked?: Record<string, boolean>;
}

// ─── Year Config (Brackets & Thresholds) ───

export interface TaxBracket {
  min: number;
  max: number | null; // null = no upper limit
  rate: number;       // decimal, e.g. 0.10 for 10%
}

export interface YearConfig {
  year: number;
  federalBrackets: TaxBracket[];
  ltcgBrackets: TaxBracket[];
  standardDeduction: number;
  /** Max net capital loss deductible against ordinary income (MFJ $3,000) */
  capitalLossLimit: number;
  amt: {
    exemption: number;
    phaseoutStart: number;
    /** Exemption reduction per $1 of AMTI over phaseoutStart (25% through 2025, 50% from 2026) */
    phaseoutRate: number;
    rate26threshold: number;
    rate26: number;
    rate28: number;
  };
  niit: {
    threshold: number;
    rate: number;
  };
  additionalMedicare: {
    threshold: number;
    rate: number;
  };
  socialSecurity: {
    wageBase: number;
    employeeRate: number;
    medicareRate: number;
  };
  childTaxCredit: {
    amount: number;
    phaseoutStart: number;
    phaseoutRate: number;
  };
  salt: {
    cap: number;
    phaseoutStart: number | null;
    phaseoutRate: number;
    floor: number;
  };
  hsa: {
    selfOnlyLimit: number;
    familyLimit: number;
    catchUpAge: number;
    catchUpAmount: number;
  };
  charitable: {
    cashAGILimit: number;   // decimal, e.g. 0.60
    propertyAGILimit: number;
    /** Itemizers: contributions only deductible above this fraction of AGI (0.005 from 2026) */
    agiFloorPct: number;
    /** Non-itemizers: max cash contribution deduction (MFJ $2,000 from 2026) */
    nonItemizerCashMax: number;
  };
  itemized: {
    /** Itemized deductions reduced by this × min(itemized, AGI over 37% bracket start); 2/37 from 2026 */
    topBracketReductionRate: number;
    /** Mortgage insurance premiums (1098 PMI) deductible — restored from 2026 */
    mortgageInsuranceDeductible: boolean;
  };
  colorado: {
    flatRate: number;
  };
  education: {
    aotcMax: number;
    aotcPhaseoutStart: number;
    aotcPhaseoutEnd: number;
  };
  estimatedTax: {
    federal: SafeHarborConfig;
    colorado: SafeHarborConfig;
  };
  fbar: {
    fbarThreshold: number;               // aggregate max balance
    form8938YearEnd: number;              // single end-of-year threshold
    form8938YearEndMFJ: number;           // MFJ end-of-year threshold
    form8938AnyTime: number;              // single any-time threshold
    form8938AnyTimeMFJ: number;           // MFJ any-time threshold
  };
}

export interface SafeHarborConfig {
  /** Share of current-year tax that satisfies the safe harbor (federal 0.90, Colorado 0.70) */
  currentYearPct: number;
  /** Share of prior-year tax (1.00), or priorYearHighIncomePct when prior AGI > highIncomeAgi */
  priorYearPct: number;
  priorYearHighIncomePct: number;
  highIncomeAgi: number;
  /** No penalty when the balance due after withholding is below this */
  minimumBalanceDue: number;
  /** Annual rate for the underpayment penalty estimate */
  penaltyRate: number;
}

// ─── Computation Results ───

export interface DeductionBreakdown {
  mortgageInterest: number;
  mortgageInsurance?: number;
  propertyTax: number;
  stateIncomeTax?: number;
  saltTotal: number;
  saltCapped: number;
  charitableCash: number;
  charitableProperty: number;
  charitableTotal: number;
  /** Section 68 (2/37) reduction of itemized deductions, 2026+ */
  itemizedReduction?: number;
  totalItemized: number;
  /** Charitable deduction for non-itemizers, 2026+ (included in deductionUsed) */
  nonItemizerCharitable?: number;
  standardDeduction: number;
  usingItemized: boolean;
  deductionUsed: number;
}

export interface FederalTaxBreakdown {
  grossIncome: number;
  wageIncome: number;
  interestIncome: number;
  ordinaryDividendIncome: number;
  qualifiedDividendIncome: number;
  shortTermCapitalGain: number;
  longTermCapitalGain: number;
  k1OrdinaryIncome: number;
  k1RentalIncome: number;
  foreignRentalIncome: number;
  otherIncome: number;
  stateRefundIncome: number;
  retirementIncome: number;
  hsaDeduction: number;
  agi: number;
  deductions: DeductionBreakdown;
  taxableIncome: number;
  ordinaryTax: number;
  capitalGainsTax: number;
  amt: number;
  niit: number;
  additionalMedicareTax: number;
  totalTaxBeforeCredits: number;
  childTaxCredit: number;
  foreignTaxCredit: number;
  educationCredit?: number;
  totalCredits: number;
  totalTax: number;
  /** Includes additional Medicare tax withheld and excess Social Security credit */
  totalWithholding: number;
  additionalMedicareWithheld?: number;
  excessSocialSecurityCredit?: number;
  totalEstimatedPayments: number;
  balanceDue: number;
  effectiveRate: number;
  marginalRate: number;
}

export interface ColoradoTaxBreakdown {
  federalTaxableIncome: number;
  stateIncomeTaxAddback?: number;
  stateRefundSubtraction?: number;
  coloradoTaxableIncome: number;
  coloradoTax: number;
  coloradoWithholding: number;
  coloradoEstimatedPayments: number;
  coloradoBalanceDue: number;
}

export interface FBARResult {
  aggregateMaxBalance: number;
  aggregateYearEndBalance: number;
  fbarRequired: boolean;     // > $10,000
  form8938Required: boolean; // end-of-year > $50k/$100k MFJ OR any-time > $75k/$150k MFJ
  accounts: Array<{ institution: string; country: string; maxValue: number; yearEndValue: number }>;
}

export interface EstimateWarning {
  form: string;
}

export interface EstimatedTaxQuarter {
  label: string;               // 'Q1'..'Q4'
  dueDate: string;             // YYYY-MM-DD
  requiredCumulative: number;
  withholdingCumulative: number;
  estimatesCumulative: number;
  /** Cumulative shortfall at this due date (with payments entered so far) */
  shortfall: number;
  /** Suggested payment for this installment to stay on track (late ones: pay now) */
  suggestedPayment: number;
  isPast: boolean;
}

export interface EstimatedTaxResult {
  jurisdiction: 'federal' | 'colorado';
  currentYearTax: number;
  priorYearTax: number | null;
  priorYearAgi: number | null;
  priorYearSource: 'entered' | 'computed' | 'none';
  /** Smaller of the current-year and prior-year tests */
  requiredAnnualPayment: number;
  basis: 'current-year' | 'prior-year';
  projectedWithholding: number;
  estimatesPaid: number;
  /** Tax − withholding − estimates */
  projectedBalanceDue: number;
  /** True when no estimates are needed at all (e.g. balance due below minimum) */
  exempt: boolean;
  exemptReason?: string;
  quarters: EstimatedTaxQuarter[];
  /** Next installment not yet due (or null after the last due date) */
  nextDue: { label: string; dueDate: string; amount: number } | null;
  /** Penalty estimate if no further estimates are paid */
  penaltyIfNothingPaid: number;
  /** Penalty already unavoidable if suggested payments are made from today */
  penaltyIfSuggestedPaid: number;
  /** Extra withholding per remaining paycheck that would cover the shortfall instead */
  extraWithholdingPerPaycheck: number | null;
  remainingPaychecks: number | null;
}

export interface ComputationResult {
  federal: FederalTaxBreakdown;
  colorado: ColoradoTaxBreakdown;
  fbar: FBARResult;
  estimatedTax?: { federal: EstimatedTaxResult; colorado: EstimatedTaxResult; asOf: string };
  estimateWarnings: EstimateWarning[];
}
