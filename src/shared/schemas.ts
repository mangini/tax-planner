import { z } from 'zod';

// ─── TaxAmount schema ───
export const TaxAmountSchema: z.ZodType = z.union([
  z.number(),
  z.object({ value: z.number(), isEstimate: z.literal(true) }),
]);

// ─── Common ───

export const FormOwnerSchema = z.enum(['self', 'spouse', 'joint']).default('self');

// ─── Form schemas ───

export const W2Schema = z.object({
  id: z.string(),
  owner: FormOwnerSchema,
  employer: z.string().default(''),
  isEstimate: z.boolean().optional(),
  wages: TaxAmountSchema.default(0),
  federalWithheld: TaxAmountSchema.default(0),
  socialSecurityWages: TaxAmountSchema.default(0),
  socialSecurityWithheld: TaxAmountSchema.default(0),
  medicareWages: TaxAmountSchema.default(0),
  medicareWithheld: TaxAmountSchema.default(0),
  stateWages: TaxAmountSchema.default(0),
  stateWithheld: TaxAmountSchema.default(0),
  hsaEmployerContribution: TaxAmountSchema.default(0),
});

export const Form1099INTSchema = z.object({
  id: z.string(),
  owner: FormOwnerSchema,
  payer: z.string().default(''),
  isEstimate: z.boolean().optional(),
  interest: TaxAmountSchema.default(0),
  isForeign: z.boolean().default(false),
  foreignTaxPaid: TaxAmountSchema.default(0),
  country: z.string().optional(),
});

export const Form1099DIVSchema = z.object({
  id: z.string(),
  owner: FormOwnerSchema,
  payer: z.string().default(''),
  isEstimate: z.boolean().optional(),
  ordinaryDividends: TaxAmountSchema.default(0),
  qualifiedDividends: TaxAmountSchema.default(0),
  capitalGainDistributions: TaxAmountSchema.default(0),
  foreignTaxPaid: TaxAmountSchema.default(0),
  country: z.string().optional(),
});

export const Form1099BSchema = z.object({
  id: z.string(),
  owner: FormOwnerSchema,
  broker: z.string().default(''),
  isEstimate: z.boolean().optional(),
  shortTermProceeds: TaxAmountSchema.default(0),
  shortTermBasis: TaxAmountSchema.default(0),
  longTermProceeds: TaxAmountSchema.default(0),
  longTermBasis: TaxAmountSchema.default(0),
});

export const Form1099GSchema = z.object({
  id: z.string(),
  owner: FormOwnerSchema,
  state: z.string().default(''),
  isEstimate: z.boolean().optional(),
  stateRefund: TaxAmountSchema.default(0),
  priorYearItemized: z.boolean().default(false),
});

export const Form1099RSchema = z.object({
  id: z.string(),
  owner: FormOwnerSchema,
  payer: z.string().default(''),
  isEstimate: z.boolean().optional(),
  grossDistribution: TaxAmountSchema.default(0),
  taxableAmount: TaxAmountSchema.default(0),
  federalWithheld: TaxAmountSchema.default(0),
  stateWithheld: TaxAmountSchema.default(0),
});

export const Form1098Schema = z.object({
  id: z.string(),
  lender: z.string().default(''),
  isEstimate: z.boolean().optional(),
  mortgageInterest: TaxAmountSchema.default(0),
  propertyTax: TaxAmountSchema.default(0),
  pmi: TaxAmountSchema.default(0),
});

export const ScheduleK1Schema = z.object({
  id: z.string(),
  owner: FormOwnerSchema,
  partnershipName: z.string().default(''),
  ein: z.string().default(''),
  isEstimate: z.boolean().optional(),
  ordinaryIncome: TaxAmountSchema.default(0),
  rentalIncome: TaxAmountSchema.default(0),
  interestIncome: TaxAmountSchema.default(0),
  ordinaryDividends: TaxAmountSchema.default(0),
  qualifiedDividends: TaxAmountSchema.default(0),
  shortTermCapitalGain: TaxAmountSchema.default(0),
  longTermCapitalGain: TaxAmountSchema.default(0),
  section199A: TaxAmountSchema.default(0),
  foreignTaxPaid: TaxAmountSchema.default(0),
  selfEmploymentEarnings: TaxAmountSchema.default(0),
});

export const ForeignRentalIncomeSchema = z.object({
  country: z.string().default(''),
  isEstimate: z.boolean().optional(),
  grossIncome: TaxAmountSchema.default(0),
  expenses: TaxAmountSchema.default(0),
  netIncome: TaxAmountSchema.default(0),
  foreignTaxPaid: TaxAmountSchema.default(0),
});

export const ForeignBankIncomeSchema = z.object({
  country: z.string().default(''),
  isEstimate: z.boolean().optional(),
  interestIncome: TaxAmountSchema.default(0),
  dividendIncome: TaxAmountSchema.default(0),
  capitalGains: TaxAmountSchema.default(0),
  foreignTaxPaid: TaxAmountSchema.default(0),
});

export const HSASchema = z.object({
  isEstimate: z.boolean().optional(),
  selfContribution: TaxAmountSchema.default(0),
  employerContribution: TaxAmountSchema.default(0),
  coverageType: z.enum(['self-only', 'family']).default('family'),
  selfAge: z.number().default(30),
  spouseAge: z.number().default(30),
});

export const CharitableDonationSchema = z.object({
  description: z.string().default(''),
  amount: TaxAmountSchema.default(0),
  type: z.enum(['cash', 'property']).default('cash'),
});

// New format: { donations: [...] }
// Old format: { cashDonations, propertyDonations } — transformed on read
export const CharitableSchema = z
  .object({
    isEstimate: z.boolean().optional(),
    donations: z.array(CharitableDonationSchema).optional(),
    cashDonations: TaxAmountSchema.optional(),
    propertyDonations: TaxAmountSchema.optional(),
  })
  .transform((val) => {
    if (val.donations) {
      return { isEstimate: val.isEstimate, donations: val.donations };
    }
    // Migrate old format → new
    const donations: z.infer<typeof CharitableDonationSchema>[] = [];
    const cash = val.cashDonations ?? 0;
    const prop = val.propertyDonations ?? 0;
    if (typeof cash === 'number' ? cash > 0 : cash.value > 0) {
      donations.push({ description: 'Cash donations', amount: cash, type: 'cash' as const });
    }
    if (typeof prop === 'number' ? prop > 0 : prop.value > 0) {
      donations.push({ description: 'Property donations', amount: prop, type: 'property' as const });
    }
    return { isEstimate: val.isEstimate, donations };
  });

export const ForeignAccountSchema = z.object({
  id: z.string(),
  owner: FormOwnerSchema,
  institution: z.string().default(''),
  country: z.string().default(''),
  accountType: z.enum(['deposit', 'securities', 'other']).default('deposit'),
  maxValue: TaxAmountSchema.default(0),
  isClosed: z.boolean().default(false),
});

export const EducationCreditsSchema = z.object({
  enabled: z.boolean().default(false),
  institution: z.string().optional(),
  tuitionPaid: TaxAmountSchema.optional(),
  scholarships: TaxAmountSchema.optional(),
});

export const EstimatedPaymentsSchema = z.object({
  federalQ1: TaxAmountSchema.default(0),
  federalQ2: TaxAmountSchema.default(0),
  federalQ3: TaxAmountSchema.default(0),
  federalQ4: TaxAmountSchema.default(0),
  stateQ1: TaxAmountSchema.default(0),
  stateQ2: TaxAmountSchema.default(0),
  stateQ3: TaxAmountSchema.default(0),
  stateQ4: TaxAmountSchema.default(0),
});

export const FilingSchema = z.object({
  status: z.enum(['single', 'mfj', 'mfs', 'hoh']).default('mfj'),
  numChildren: z.number().default(1),
});

// ─── Full Tax Year Data schema ───

export const TaxYearDataSchema = z.object({
  year: z.number(),
  filing: FilingSchema.default({ status: 'mfj', numChildren: 1 }),
  w2: z.array(W2Schema).default([]),
  form1099INT: z.array(Form1099INTSchema).default([]),
  form1099DIV: z.array(Form1099DIVSchema).default([]),
  form1099B: z.array(Form1099BSchema).default([]),
  form1099G: z.array(Form1099GSchema).default([]),
  form1099R: z.array(Form1099RSchema).default([]),
  form1098: z.array(Form1098Schema).default([]),
  scheduleK1: z.array(ScheduleK1Schema).default([]),
  foreignRentalIncome: ForeignRentalIncomeSchema.optional(),
  foreignBankIncome: ForeignBankIncomeSchema.optional(),
  hsa: HSASchema.optional(),
  charitable: CharitableSchema.optional(),
  foreignAccounts: z.array(ForeignAccountSchema).default([]),
  educationCredits: EducationCreditsSchema.optional(),
  estimatedPayments: EstimatedPaymentsSchema.optional(),
});

// ─── Year Config schemas ───

export const TaxBracketSchema = z.object({
  min: z.number(),
  max: z.number().nullable(),
  rate: z.number(),
});

export const YearConfigSchema = z.object({
  year: z.number(),
  federalBrackets: z.array(TaxBracketSchema),
  ltcgBrackets: z.array(TaxBracketSchema),
  standardDeduction: z.number(),
  amt: z.object({
    exemption: z.number(),
    phaseoutStart: z.number(),
    rate26threshold: z.number(),
    rate26: z.number(),
    rate28: z.number(),
  }),
  niit: z.object({
    threshold: z.number(),
    rate: z.number(),
  }),
  additionalMedicare: z.object({
    threshold: z.number(),
    rate: z.number(),
  }),
  socialSecurity: z.object({
    wageBase: z.number(),
    employeeRate: z.number(),
    medicareRate: z.number(),
  }),
  childTaxCredit: z.object({
    amount: z.number(),
    phaseoutStart: z.number(),
    phaseoutRate: z.number(),
  }),
  salt: z.object({
    cap: z.number(),
    phaseoutStart: z.number().nullable(),
    phaseoutRate: z.number(),
    floor: z.number(),
  }),
  hsa: z.object({
    selfOnlyLimit: z.number(),
    familyLimit: z.number(),
    catchUpAge: z.number(),
    catchUpAmount: z.number(),
  }),
  charitable: z.object({
    cashAGILimit: z.number(),
    propertyAGILimit: z.number(),
  }),
  colorado: z.object({
    flatRate: z.number(),
  }),
  education: z.object({
    aotcMax: z.number(),
    aotcPhaseoutStart: z.number(),
    aotcPhaseoutEnd: z.number(),
  }),
});
