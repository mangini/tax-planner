import type { FormOwner, RSUGrant } from './types.js';

export interface ValuedVest {
  grantId: string;
  grantName: string;
  company: string;
  owner: FormOwner;
  date: string;
  shares: number;
  price: number | null; // null when no price entered for the company
  value: number;
}

/**
 * Vests falling in `year`, valued at the assumed price for their company.
 * `after` (YYYY-MM-DD, exclusive) limits to vests after a payslip date.
 */
export function vestsInYear(
  grants: RSUGrant[] | undefined,
  prices: Record<string, number> | undefined,
  year: number,
  opts: { owner?: FormOwner; after?: string } = {}
): ValuedVest[] {
  const out: ValuedVest[] = [];
  for (const g of grants ?? []) {
    if (opts.owner && g.owner !== opts.owner) continue;
    const price = prices?.[g.company] ?? null;
    for (const v of g.vests) {
      if (!v.date.startsWith(`${year}-`)) continue;
      if (opts.after && v.date <= opts.after) continue;
      out.push({
        grantId: g.id,
        grantName: g.grantName,
        company: g.company,
        owner: g.owner,
        date: v.date,
        shares: v.shares,
        price,
        value: price !== null ? Math.round(v.shares * price * 100) / 100 : 0,
      });
    }
  }
  return out.sort((a, b) => a.date.localeCompare(b.date));
}

export function totalValue(vests: ValuedVest[]): number {
  return Math.round(vests.reduce((s, v) => s + v.value, 0) * 100) / 100;
}
