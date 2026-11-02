import type { RSUVest } from './types.js';

/**
 * Parse a Morgan Stanley at Work "Employee Grant Details" HTML export.
 *
 * Pure string parsing (no DOM): the export contains scripts, and this never evaluates
 * any of it. Only the company, grant name/date and vest schedule are extracted —
 * personal fields (employee name, agreement links) are ignored.
 *
 * Vest table columns: Vest Date | Total Potential Vesting At Date | Granted |
 * Forfeited | Distributed | Outstanding | Expire/Cancel Date.
 * Shares vesting on a date = Granted − Forfeited.
 */

export interface ParsedGrant {
  company: string;
  grantName: string;
  grantDate: string; // YYYY-MM-DD or ''
  vests: RSUVest[];
}

const MONTHS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};

function decodeEntities(s: string): string {
  return s
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

function text(fragment: string): string {
  return decodeEntities(fragment.replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();
}

/** '18-Nov-2026' → '2026-11-18'; returns null if not a date. */
export function parseMSDate(s: string): string | null {
  const m = /^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/.exec(s.trim());
  if (!m) return null;
  const month = MONTHS[m[2].toLowerCase()];
  if (!month) return null;
  return `${m[3]}-${String(month).padStart(2, '0')}-${m[1].padStart(2, '0')}`;
}

function parseShares(s: string): number {
  const n = parseFloat(s.replace(/,/g, ''));
  return Number.isFinite(n) ? n : 0;
}

/** Value following a `<strong>Label:</strong>` up to the next tag. */
function labeledField(html: string, label: string): string {
  const re = new RegExp(`<strong>\\s*${label}\\s*:?\\s*</strong>([^<]*)`, 'i');
  const m = re.exec(html);
  return m ? text(m[1]) : '';
}

export function parseMorganStanleyGrant(html: string): ParsedGrant {
  // Drop scripts/styles/comments up front so nothing in them is matched
  const clean = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '');

  const companyMatch = /Company Name:\s*([^<]*)</i.exec(clean);
  const company = companyMatch ? text(companyMatch[1]) : '';
  const grantName = labeledField(clean, 'Grant Name');
  const grantDate = parseMSDate(labeledField(clean, 'Grant Date')) ?? '';

  const tableMatch = /<table[^>]*id=["']Vest Schedule[^"']*["'][^>]*>([\s\S]*?)<\/table>/i.exec(clean);
  if (!tableMatch) {
    throw new Error('No "Vest Schedule" table found — is this a Morgan Stanley Employee Grant Details export?');
  }

  const vests: RSUVest[] = [];
  const rows = tableMatch[1].match(/<tr[\s\S]*?<\/tr>/gi) ?? [];
  for (const row of rows) {
    const cells = (row.match(/<td[\s\S]*?<\/td>/gi) ?? []).map(text);
    if (cells.length < 4) continue; // header rows use <th>
    const date = parseMSDate(cells[0]);
    if (!date) continue;            // totals row has a blank date
    const shares = parseShares(cells[2]) - parseShares(cells[3]);
    if (shares > 0) vests.push({ date, shares });
  }

  if (vests.length === 0) throw new Error('Vest Schedule table has no vest rows.');
  vests.sort((a, b) => a.date.localeCompare(b.date));
  return { company, grantName, grantDate, vests };
}
