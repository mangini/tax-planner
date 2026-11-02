import type {
  EstimatedTaxQuarter,
  EstimatedTaxResult,
  SafeHarborConfig,
} from '../../shared/types.js';

/**
 * Quarterly estimated tax check (regular installment method, Form 2210 / DR 0204 style).
 *
 * Required annual payment = min(currentYearPct × this year's tax,
 *                               priorYearPct (or high-income pct) × last year's tax).
 * Each installment is 25% of it, due Apr 15, Jun 15, Sep 15 and Jan 15 (next business day).
 * Withholding is treated as paid evenly on the four due dates (the default rule),
 * so it counts toward early quarters even if it is withheld late in the year.
 * Estimates entered for Qn are assumed paid by Qn's due date.
 *
 * Not modeled: annualized income installment method, waivers, holidays other than weekends.
 */

export interface EstimatedTaxInput {
  jurisdiction: 'federal' | 'colorado';
  year: number;
  currentYearTax: number;
  projectedWithholding: number;
  /** Estimates paid for Q1..Q4 */
  estimates: [number, number, number, number];
  priorYear: { tax: number; agi: number; source: 'entered' | 'computed' } | null;
  rules: SafeHarborConfig;
  /** Today, YYYY-MM-DD */
  asOf: string;
  /** Paychecks left in the year (for the W-4 alternative), if known */
  remainingPaychecks: number | null;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

function toISO(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Move Saturday/Sunday to the following Monday. */
function nextBusinessDay(year: number, month: number, day: number): string {
  const d = new Date(Date.UTC(year, month - 1, day));
  const dow = d.getUTCDay();
  if (dow === 6) d.setUTCDate(d.getUTCDate() + 2);
  if (dow === 0) d.setUTCDate(d.getUTCDate() + 1);
  return toISO(d);
}

export function installmentDueDates(year: number): string[] {
  return [
    nextBusinessDay(year, 4, 15),
    nextBusinessDay(year, 6, 15),
    nextBusinessDay(year, 9, 15),
    nextBusinessDay(year + 1, 1, 15),
  ];
}

function daysBetween(a: string, b: string): number {
  return Math.max(0, (Date.parse(b) - Date.parse(a)) / 86_400_000);
}

interface Payment {
  date: string;
  amount: number;
}

/**
 * Penalty: payments are applied to the earliest unpaid installment; each unpaid
 * portion accrues rate × days late / 365 until paid (or the return due date).
 */
export function simulatePenalty(
  installments: { dueDate: string; amount: number }[],
  payments: Payment[],
  rate: number,
  finalDate: string
): number {
  const due = installments.map((i) => ({ ...i, remaining: i.amount }));
  const pays = [...payments].filter((p) => p.amount > 0).sort((a, b) => a.date.localeCompare(b.date));
  let penalty = 0;

  for (const p of pays) {
    let left = p.amount;
    for (const inst of due) {
      if (left <= 0) break;
      if (inst.remaining <= 0) continue;
      const applied = Math.min(left, inst.remaining);
      penalty += applied * rate * daysBetween(inst.dueDate, p.date) / 365;
      inst.remaining -= applied;
      left -= applied;
    }
  }
  // Anything still unpaid is paid with the return
  for (const inst of due) {
    if (inst.remaining > 0) penalty += inst.remaining * rate * daysBetween(inst.dueDate, finalDate) / 365;
  }
  return round2(penalty);
}

export function computeEstimatedTax(input: EstimatedTaxInput): EstimatedTaxResult {
  const { rules, year, asOf } = input;
  const currentYearTax = Math.max(0, input.currentYearTax);
  const estimatesPaid = input.estimates.reduce((s, e) => s + e, 0);
  const projectedBalanceDue = round2(currentYearTax - input.projectedWithholding - estimatesPaid);

  // Required annual payment
  const currentTest = currentYearTax * rules.currentYearPct;
  let priorTest: number | null = null;
  if (input.priorYear) {
    const pct = input.priorYear.agi > rules.highIncomeAgi ? rules.priorYearHighIncomePct : rules.priorYearPct;
    priorTest = Math.max(0, input.priorYear.tax) * pct;
  }
  const usePrior = priorTest !== null && priorTest < currentTest;
  const requiredAnnualPayment = round2(usePrior ? priorTest! : currentTest);

  const dueDates = installmentDueDates(year);
  const returnDue = nextBusinessDay(year + 1, 4, 15);
  const installment = requiredAnnualPayment / 4;
  const withholdingPerQuarter = input.projectedWithholding / 4;

  // Quarters with the payments entered so far, plus a catch-up plan from today
  const quarters: EstimatedTaxQuarter[] = [];
  let estimatesCum = 0;
  let suggestedCum = 0;
  for (let q = 0; q < 4; q++) {
    estimatesCum += input.estimates[q];
    const requiredCumulative = installment * (q + 1);
    const withholdingCumulative = withholdingPerQuarter * (q + 1);
    const shortfall = Math.max(0, requiredCumulative - withholdingCumulative - estimatesCum);
    const isPast = dueDates[q] < asOf;
    // Past quarters can't be paid on time anymore: their shortfall rolls into the next open installment
    const suggestedPayment = isPast ? 0 : Math.max(0, shortfall - suggestedCum);
    suggestedCum += suggestedPayment;
    quarters.push({
      label: `Q${q + 1}`,
      dueDate: dueDates[q],
      requiredCumulative: round2(requiredCumulative),
      withholdingCumulative: round2(withholdingCumulative),
      estimatesCumulative: round2(estimatesCum),
      shortfall: round2(shortfall),
      suggestedPayment: round2(suggestedPayment),
      isPast,
    });
  }

  // Exemptions
  let exempt = false;
  let exemptReason: string | undefined;
  if (projectedBalanceDue < rules.minimumBalanceDue) {
    exempt = true;
    exemptReason = `Projected balance due is under $${rules.minimumBalanceDue.toLocaleString('en-US')}.`;
  } else if (input.priorYear && input.priorYear.tax <= 0) {
    exempt = true;
    exemptReason = 'No tax liability last year.';
  } else if (quarters.every((q) => q.shortfall <= 0)) {
    exempt = true;
    exemptReason = usePrior
      ? 'Withholding and estimates cover the prior-year safe harbor.'
      : 'Withholding and estimates cover the current-year safe harbor.';
  }
  if (exempt) for (const q of quarters) q.suggestedPayment = 0;

  const next = quarters.find((q) => !q.isPast) ?? null;
  const nextDue = next ? { label: next.label, dueDate: next.dueDate, amount: next.suggestedPayment } : null;

  // Penalty estimates
  const installments = dueDates.map((dueDate) => ({ dueDate, amount: installment }));
  const basePayments: Payment[] = dueDates.flatMap((d, q) => [
    { date: d, amount: withholdingPerQuarter },
    { date: d, amount: input.estimates[q] },
  ]);
  const penaltyIfNothingPaid = exempt ? 0 : simulatePenalty(installments, basePayments, rules.penaltyRate, returnDue);
  const suggestedPayments: Payment[] = quarters
    .filter((q) => q.suggestedPayment > 0)
    .map((q) => ({ date: q.dueDate, amount: q.suggestedPayment }));
  // Shortfall from past quarters is suggested in the first open quarter; assume it is paid today
  if (next && suggestedPayments.length > 0 && suggestedPayments[0].date === next.dueDate) {
    const pastShortfall = quarters.filter((q) => q.isPast).at(-1)?.shortfall ?? 0;
    if (pastShortfall > 0) {
      suggestedPayments[0].amount -= Math.min(pastShortfall, suggestedPayments[0].amount);
      suggestedPayments.unshift({ date: asOf, amount: pastShortfall });
    }
  }
  const penaltyIfSuggestedPaid = exempt
    ? 0
    : simulatePenalty(installments, [...basePayments, ...suggestedPayments], rules.penaltyRate, returnDue);

  // W-4 alternative: extra withholding counts as paid evenly, so it also cures past quarters
  const gap = Math.max(0, requiredAnnualPayment - input.projectedWithholding - estimatesPaid);
  const extraWithholdingPerPaycheck =
    !exempt && gap > 0 && input.remainingPaychecks && input.remainingPaychecks > 0
      ? round2(gap / input.remainingPaychecks)
      : null;

  return {
    jurisdiction: input.jurisdiction,
    currentYearTax: round2(currentYearTax),
    priorYearTax: input.priorYear ? input.priorYear.tax : null,
    priorYearAgi: input.priorYear ? input.priorYear.agi : null,
    priorYearSource: input.priorYear ? input.priorYear.source : 'none',
    requiredAnnualPayment,
    basis: usePrior ? 'prior-year' : 'current-year',
    projectedWithholding: round2(input.projectedWithholding),
    estimatesPaid: round2(estimatesPaid),
    projectedBalanceDue,
    exempt,
    exemptReason,
    quarters,
    nextDue,
    penaltyIfNothingPaid,
    penaltyIfSuggestedPaid,
    extraWithholdingPerPaycheck,
    remainingPaychecks: input.remainingPaychecks,
  };
}
