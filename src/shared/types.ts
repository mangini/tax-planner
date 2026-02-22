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

export interface CharitableData {
  isEstimate?: boolean;
  cashDonations: TaxAmount;
  propertyDonations: TaxAmount;
}

export interface ForeignAccountData {
  id: string;
  owner: FormOwner;
  institution: string;
  country: string;
  accountType: 'deposit' | 'securities' | 'other';
  maxValue: TaxAmount;
  isClosed: boolean;
}

export interface EducationCreditsData {
  enabled: boolean;
  institution?: string;
  tuitionPaid?: TaxAmount;
  scholarships?: TaxAmount;
}

export interface EstimatedPaymentsData {
  federalQ1: TaxAmount;
  federalQ2: TaxAmount;
  federalQ3: TaxAmount;
  federalQ4: TaxAmount;
  stateQ1: TaxAmount;
  stateQ2: TaxAmount;
  stateQ3: TaxAmount;
  stateQ4: TaxAmount;
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
  amt: {
    exemption: number;
    phaseoutStart: number;
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
  };
  colorado: {
    flatRate: number;
  };
  education: {
    aotcMax: number;
    aotcPhaseoutStart: number;
    aotcPhaseoutEnd: number;
  };
}

// ─── Computation Results ───

export interface DeductionBreakdown {
  mortgageInterest: number;
  propertyTax: number;
  saltTotal: number;
  saltCapped: number;
  charitableCash: number;
  charitableProperty: number;
  charitableTotal: number;
  totalItemized: number;
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
  totalCredits: number;
  totalTax: number;
  totalWithholding: number;
  totalEstimatedPayments: number;
  balanceDue: number;
  effectiveRate: number;
  marginalRate: number;
}

export interface ColoradoTaxBreakdown {
  federalTaxableIncome: number;
  coloradoTaxableIncome: number;
  coloradoTax: number;
  coloradoWithholding: number;
  coloradoEstimatedPayments: number;
  coloradoBalanceDue: number;
}

export interface FBARResult {
  aggregateMaxBalance: number;
  fbarRequired: boolean;     // > $10,000
  form8938Required: boolean; // > $50,000 single / $100,000 MFJ (end of year)
  accounts: Array<{ institution: string; country: string; maxValue: number }>;
}

export interface EstimateWarning {
  form: string;
}

export interface ComputationResult {
  federal: FederalTaxBreakdown;
  colorado: ColoradoTaxBreakdown;
  fbar: FBARResult;
  estimateWarnings: EstimateWarning[];
}
