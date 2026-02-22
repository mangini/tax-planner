import { describe, it, expect } from 'vitest';
import { computeTax } from '../../engine/index.js';
import { createYear, writeYearData, readYearData, deleteYear, yearExists } from '../../storage.js';
import { config2025 } from '../../../shared/tax-config-2025.js';
import type { TaxYearData } from '../../../shared/types.js';

describe('computeTax integration', () => {
  it('computes full scenario with all form types', () => {
    const data: TaxYearData = {
      year: 2025,
      filing: { status: 'mfj', numChildren: 1 },
      w2: [{
        id: '1',
        owner: 'self',
        employer: 'BigTech Inc',
        wages: 450000,
        federalWithheld: 100000,
        socialSecurityWages: 176100,
        socialSecurityWithheld: 10918,
        medicareWages: 450000,
        medicareWithheld: 6525,
        stateWages: 450000,
        stateWithheld: 18000,
        hsaEmployerContribution: 1000,
      }],
      form1099INT: [
        { id: '1', owner: 'self', payer: 'US Bank', interest: 5000, isForeign: false, foreignTaxPaid: 0 },
        { id: '2', owner: 'self', payer: 'Foreign Bank', interest: 3000, isForeign: true, foreignTaxPaid: 450, country: 'Brazil' },
      ],
      form1099DIV: [
        {
          id: '1', owner: 'self', payer: 'Vanguard',
          ordinaryDividends: 8000, qualifiedDividends: 6000,
          capitalGainDistributions: 4000, foreignTaxPaid: 200,
        },
      ],
      form1099B: [{
        id: '1', owner: 'self', broker: 'Schwab',
        shortTermProceeds: 50000, shortTermBasis: 45000,
        longTermProceeds: 100000, longTermBasis: 60000,
      }],
      form1099G: [{ id: '1', owner: 'self', state: 'CO', stateRefund: 2000, priorYearItemized: true }],
      form1099R: [],
      form1098: [{
        id: '1', lender: 'Mortgage Co', mortgageInterest: 25000, propertyTax: 12000, pmi: 0,
      }],
      scheduleK1: [
        {
          id: '1', owner: 'self', partnershipName: 'Investment LP', ein: '12-3456789',
          ordinaryIncome: 30000, rentalIncome: 5000,
          interestIncome: 2000, ordinaryDividends: 1000, qualifiedDividends: 800,
          shortTermCapitalGain: 1000, longTermCapitalGain: 10000,
          section199A: 5000, foreignTaxPaid: 300, selfEmploymentEarnings: 0,
        },
      ],
      foreignRentalIncome: {
        country: 'Brazil', grossIncome: 20000, expenses: 8000,
        netIncome: 12000, foreignTaxPaid: 1800,
      },
      foreignBankIncome: {
        country: 'Brazil', interestIncome: 2000, dividendIncome: 500,
        capitalGains: 1000, foreignTaxPaid: 500,
      },
      hsa: {
        selfContribution: 5000, employerContribution: 0,
        coverageType: 'family', selfAge: 40, spouseAge: 38,
      },
      charitable: { cashDonations: 15000, propertyDonations: 5000 },
      foreignAccounts: [
        { id: '1', owner: 'self', institution: 'Banco do Brasil', country: 'Brazil', accountType: 'deposit', maxValue: 25000, isClosed: false },
        { id: '2', owner: 'self', institution: 'XP Investimentos', country: 'Brazil', accountType: 'securities', maxValue: 80000, isClosed: false },
      ],
      estimatedPayments: {
        federalQ1: 10000, federalQ2: 10000, federalQ3: 10000, federalQ4: 10000,
        stateQ1: 3000, stateQ2: 3000, stateQ3: 3000, stateQ4: 3000,
      },
    };

    const result = computeTax(data, config2025);

    // Federal checks
    expect(result.federal.grossIncome).toBeGreaterThan(500000);
    expect(result.federal.agi).toBeGreaterThan(0);
    expect(result.federal.taxableIncome).toBeGreaterThan(0);
    expect(result.federal.ordinaryTax).toBeGreaterThan(0);
    expect(result.federal.capitalGainsTax).toBeGreaterThan(0);

    // NIIT should apply (AGI > $250k and has investment income)
    expect(result.federal.niit).toBeGreaterThan(0);

    // Additional Medicare should apply (wages $450k > $250k)
    expect(result.federal.additionalMedicareTax).toBeGreaterThan(0);
    expect(result.federal.additionalMedicareTax).toBe(1800); // ($450k - $250k) * 0.9%

    // Child tax credit phases out to 0 (AGI >> $400k)
    expect(result.federal.childTaxCredit).toBe(0);

    // Foreign tax credit
    expect(result.federal.foreignTaxCredit).toBeGreaterThan(0);

    // Withholding and estimated
    expect(result.federal.totalWithholding).toBe(100000);
    expect(result.federal.totalEstimatedPayments).toBe(40000);

    // Deductions: should itemize (mortgage $25k + SALT + charitable > $30k standard)
    expect(result.federal.deductions.usingItemized).toBe(true);

    // Effective rate should be reasonable (15-30%)
    expect(result.federal.effectiveRate).toBeGreaterThan(0.15);
    expect(result.federal.effectiveRate).toBeLessThan(0.35);

    // Colorado
    expect(result.colorado.coloradoTax).toBeGreaterThan(0);
    expect(result.colorado.coloradoWithholding).toBe(18000);
    expect(result.colorado.coloradoEstimatedPayments).toBe(12000);

    // FBAR
    expect(result.fbar.aggregateMaxBalance).toBe(105000);
    expect(result.fbar.fbarRequired).toBe(true);
    expect(result.fbar.form8938Required).toBe(true);

    // Estimate warnings should be empty (all values are final numbers)
    expect(result.estimateWarnings).toHaveLength(0);
  });

  it('supports multiple W-2s', () => {
    const data: TaxYearData = {
      year: 2025,
      filing: { status: 'mfj', numChildren: 0 },
      w2: [
        {
          id: '1', owner: 'self', employer: 'Job A',
          wages: 200000, federalWithheld: 40000,
          socialSecurityWages: 176100, socialSecurityWithheld: 10918,
          medicareWages: 200000, medicareWithheld: 2900,
          stateWages: 200000, stateWithheld: 8000,
          hsaEmployerContribution: 0,
        },
        {
          id: '2', owner: 'spouse', employer: 'Job B',
          wages: 100000, federalWithheld: 20000,
          socialSecurityWages: 100000, socialSecurityWithheld: 6200,
          medicareWages: 100000, medicareWithheld: 1450,
          stateWages: 100000, stateWithheld: 4000,
          hsaEmployerContribution: 0,
        },
      ],
      form1099INT: [],
      form1099DIV: [],
      form1099B: [],
      form1099G: [],
      form1099R: [],
      form1098: [],
      scheduleK1: [],
      foreignAccounts: [],
    };

    const result = computeTax(data, config2025);
    expect(result.federal.wageIncome).toBe(300000);
    expect(result.federal.totalWithholding).toBe(60000);
    expect(result.colorado.coloradoWithholding).toBe(12000);
  });

  it('collects estimate warnings', () => {
    const data: TaxYearData = {
      year: 2025,
      filing: { status: 'mfj', numChildren: 1 },
      w2: [{
        id: '1',
        owner: 'self',
        employer: 'Co',
        isEstimate: true,
        wages: 400000,
        federalWithheld: 90000,
        socialSecurityWages: 176100,
        socialSecurityWithheld: 10918,
        medicareWages: 400000,
        medicareWithheld: 5800,
        stateWages: 400000,
        stateWithheld: 15000,
        hsaEmployerContribution: 0,
      }],
      form1099INT: [],
      form1099DIV: [],
      form1099B: [],
      form1099G: [],
      form1099R: [],
      form1098: [],
      scheduleK1: [],
      foreignAccounts: [],
    };

    const result = computeTax(data, config2025);
    expect(result.estimateWarnings).toHaveLength(1);
    expect(result.estimateWarnings[0].form).toContain('W-2');
  });

  it('clones year data with estimates', () => {
    // Use a unique test year to avoid conflicts
    const srcYear = 9990;
    const dstYear = 9991;
    try {
      // Create source year with concrete values
      const srcData: TaxYearData = {
        year: srcYear,
        filing: { status: 'mfj', numChildren: 1 },
        w2: [{
          id: 'orig', owner: 'self', employer: 'TestCo',
          wages: 100000, federalWithheld: 20000,
          socialSecurityWages: 100000, socialSecurityWithheld: 6200,
          medicareWages: 100000, medicareWithheld: 1450,
          stateWages: 100000, stateWithheld: 4000,
          hsaEmployerContribution: 500,
        }],
        form1099INT: [{ id: 'orig', owner: 'self', payer: 'Bank', interest: 1000, isForeign: false, foreignTaxPaid: 0 }],
        form1099DIV: [], form1099B: [], form1099G: [], form1099R: [],
        form1098: [], scheduleK1: [], foreignAccounts: [],
      };
      writeYearData(srcYear, srcData);

      // Clone to new year
      const cloned = createYear(dstYear, srcYear);

      // Structural info preserved
      expect(cloned.year).toBe(dstYear);
      expect(cloned.w2).toHaveLength(1);
      expect(cloned.w2[0].employer).toBe('TestCo');
      expect(cloned.w2[0].owner).toBe('self');
      expect(cloned.form1099INT).toHaveLength(1);
      expect(cloned.form1099INT[0].payer).toBe('Bank');

      // New IDs assigned
      expect(cloned.w2[0].id).not.toBe('orig');
      expect(cloned.form1099INT[0].id).not.toBe('orig');

      // Forms marked as estimates
      expect(cloned.w2[0].isEstimate).toBe(true);
      expect(cloned.form1099INT[0].isEstimate).toBe(true);

      // Values are plain numbers (not TaxAmount objects)
      expect(cloned.w2[0].wages).toBe(100000);
      expect(cloned.form1099INT[0].interest).toBe(1000);
      expect(cloned.form1099INT[0].foreignTaxPaid).toBe(0);

      // Estimated payments cleared
      expect(cloned.estimatedPayments).toBeUndefined();

      // Filing info preserved as-is
      expect(cloned.filing.status).toBe('mfj');
    } finally {
      // Cleanup
      if (yearExists(srcYear)) deleteYear(srcYear);
      if (yearExists(dstYear)) deleteYear(dstYear);
    }
  });

  it('handles empty data gracefully', () => {
    const data: TaxYearData = {
      year: 2025,
      filing: { status: 'mfj', numChildren: 0 },
      w2: [],
      form1099INT: [],
      form1099DIV: [],
      form1099B: [],
      form1099G: [],
      form1099R: [],
      form1098: [],
      scheduleK1: [],
      foreignAccounts: [],
    };

    const result = computeTax(data, config2025);
    expect(result.federal.grossIncome).toBe(0);
    expect(result.federal.totalTax).toBe(0);
    expect(result.federal.balanceDue).toBe(0);
    expect(result.colorado.coloradoTax).toBe(0);
  });
});
