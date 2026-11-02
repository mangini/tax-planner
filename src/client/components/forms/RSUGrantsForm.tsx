import { useState } from 'react';
import { v4 as uuid } from 'uuid';
import type { RSUGrant, RSUVest } from '@shared/types';
import { parseMorganStanleyGrant } from '@shared/morgan-stanley';
import { vestsInYear, totalValue } from '@shared/rsu';
import MoneyInput from './MoneyInput';
import OwnerSelect from './OwnerSelect';
import FormEditor from './FormEditor';

interface Props {
  year: number;
  grants: RSUGrant[];
  prices: Record<string, number>;
  onSave: (data: { rsuGrants: RSUGrant[]; rsuPrices: Record<string, number> }) => Promise<void>;
}

function fmt(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

const sameGrant = (a: Pick<RSUGrant, 'company' | 'grantName' | 'grantDate'>, b: typeof a) =>
  a.company === b.company && a.grantName === b.grantName && a.grantDate === b.grantDate;

export default function RSUGrantsForm({ year, grants: initialGrants, prices: initialPrices, onSave }: Props) {
  const [grants, setGrants] = useState<RSUGrant[]>(initialGrants);
  const [prices, setPrices] = useState<Record<string, number>>(initialPrices);
  const [saving, setSaving] = useState(false);
  const [messages, setMessages] = useState<{ ok: boolean; text: string }[]>([]);

  const updateGrant = (id: string, patch: Partial<RSUGrant>) =>
    setGrants((gs) => gs.map((g) => (g.id === id ? { ...g, ...patch } : g)));

  const updateVest = (id: string, idx: number, patch: Partial<RSUVest>) =>
    setGrants((gs) =>
      gs.map((g) => (g.id === id ? { ...g, vests: g.vests.map((v, i) => (i === idx ? { ...v, ...patch } : v)) } : g))
    );

  const handleImport = async (files: FileList | null) => {
    if (!files) return;
    const results: { ok: boolean; text: string }[] = [];
    let next = [...grants];
    for (const file of Array.from(files)) {
      try {
        const parsed = parseMorganStanleyGrant(await file.text());
        const existing = next.find((g) => sameGrant(g, parsed));
        if (existing) {
          next = next.map((g) => (g.id === existing.id ? { ...g, vests: parsed.vests, source: 'morgan-stanley' } : g));
          results.push({ ok: true, text: `${file.name}: updated "${parsed.grantName}" (${parsed.vests.length} vests)` });
        } else {
          next.push({ id: uuid(), owner: 'self', ...parsed, source: 'morgan-stanley' });
          results.push({ ok: true, text: `${file.name}: imported "${parsed.grantName}" (${parsed.vests.length} vests)` });
        }
      } catch (e: any) {
        results.push({ ok: false, text: `${file.name}: ${e.message}` });
      }
    }
    setGrants(next);
    setMessages(results);
  };

  const addManual = () =>
    setGrants([...grants, { id: uuid(), owner: 'self', company: '', grantName: '', grantDate: '', vests: [], source: 'manual' }]);

  const companies = Array.from(new Set(grants.map((g) => g.company).filter(Boolean)));
  const yearVests = vestsInYear(grants, prices, year);
  const missingPrice = companies.filter((c) => !prices[c]);

  const handleSave = async () => {
    setSaving(true);
    const cleaned = grants.map((g) => ({
      ...g,
      vests: g.vests.filter((v) => v.date && v.shares > 0).sort((a, b) => a.date.localeCompare(b.date)),
    }));
    // Drop prices for companies that no longer have grants
    const keptPrices = Object.fromEntries(Object.entries(prices).filter(([c]) => companies.includes(c)));
    await onSave({ rsuGrants: cleaned, rsuPrices: keptPrices });
    setGrants(cleaned);
    setSaving(false);
  };

  return (
    <FormEditor title="RSU Grants" onSave={handleSave} saving={saving}>
      <div className="space-y-5">
        {/* Import */}
        <div className="border border-dashed border-gray-300 rounded-lg p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-gray-700">Import from Morgan Stanley at Work</p>
              <p className="text-xs text-gray-400">
                Stock Plan → Grants → Employee Grant Details → save the page as HTML. Select one or more files.
                Only the company, grant name/date and vest schedule are kept.
              </p>
            </div>
            <label className="shrink-0 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-sm rounded cursor-pointer">
              Choose files…
              <input
                type="file"
                accept=".html,.htm,text/html"
                multiple
                className="hidden"
                onChange={(e) => { handleImport(e.target.files); e.target.value = ''; }}
              />
            </label>
          </div>
          {messages.length > 0 && (
            <ul className="mt-3 space-y-0.5 text-xs">
              {messages.map((m, i) => (
                <li key={i} className={m.ok ? 'text-green-700' : 'text-red-600'}>{m.text}</li>
              ))}
            </ul>
          )}
        </div>

        {/* Prices */}
        {companies.length > 0 && (
          <div>
            <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Assumed share price ({year})</h3>
            <div className="grid grid-cols-3 gap-3">
              {companies.map((c) => (
                <MoneyInput key={c} label={c} value={prices[c] ?? 0} onChange={(v) => setPrices((p) => ({ ...p, [c]: v }))} />
              ))}
            </div>
            {missingPrice.length > 0 && (
              <p className="text-xs text-amber-700 mt-1">Enter a price to value vests for: {missingPrice.join(', ')}</p>
            )}
          </div>
        )}

        {/* Vests this year */}
        {yearVests.length > 0 && (
          <div className="rounded border border-gray-100">
            <div className="px-3 py-2 bg-gray-50 text-xs font-medium text-gray-600 flex justify-between">
              <span>Vests in {year}</span>
              <span>{fmt(totalValue(yearVests))}</span>
            </div>
            <table className="w-full text-xs">
              <tbody>
                {yearVests.map((v, i) => (
                  <tr key={i} className="border-t border-gray-100">
                    <td className="px-3 py-1 tabular-nums">{v.date}</td>
                    <td className="px-3 py-1 text-gray-500">{v.grantName}</td>
                    <td className="px-3 py-1 text-gray-500">{v.owner}</td>
                    <td className="px-3 py-1 text-right tabular-nums">{v.shares.toLocaleString('en-US')} sh</td>
                    <td className="px-3 py-1 text-right tabular-nums">{v.price !== null ? fmt(v.value) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Grants */}
        {grants.length === 0 && <p className="text-gray-500 text-sm">No grants. Import a file or add one manually.</p>}
        {grants.map((g) => (
          <div key={g.id} className="rounded-lg border border-gray-100 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50">
              <OwnerSelect value={g.owner} onChange={(v) => updateGrant(g.id, { owner: v })} />
              <input
                type="text" placeholder="Company" value={g.company}
                onChange={(e) => updateGrant(g.id, { company: e.target.value })}
                className="border border-gray-200 rounded px-2 py-1 text-sm w-48 bg-white/80"
              />
              <input
                type="text" placeholder="Grant name" value={g.grantName}
                onChange={(e) => updateGrant(g.id, { grantName: e.target.value })}
                className="border border-gray-200 rounded px-2 py-1 text-sm flex-1 bg-white/80"
              />
              <span className="text-xs text-gray-400">{g.source === 'morgan-stanley' ? 'Imported' : 'Manual'}</span>
              <button onClick={() => setGrants(grants.filter((x) => x.id !== g.id))} className="text-red-400 hover:text-red-600 text-xs">
                Remove
              </button>
            </div>
            <div className="px-4 py-3">
              <div className="grid grid-cols-4 gap-x-4 gap-y-1">
                {g.vests.map((v, i) => (
                  <div key={i} className={`flex items-center gap-1 ${v.date.startsWith(`${year}-`) ? '' : 'opacity-50'}`}>
                    <input
                      type="date" value={v.date}
                      onChange={(e) => updateVest(g.id, i, { date: e.target.value })}
                      className="border border-gray-200 rounded px-1 py-0.5 text-xs"
                    />
                    <input
                      type="number" min={0} value={v.shares || ''}
                      onChange={(e) => updateVest(g.id, i, { shares: parseFloat(e.target.value) || 0 })}
                      className="border border-gray-200 rounded px-1 py-0.5 text-xs w-16 text-right"
                    />
                    <button
                      onClick={() => updateGrant(g.id, { vests: g.vests.filter((_, j) => j !== i) })}
                      className="text-gray-300 hover:text-red-500 text-xs" aria-label="Remove vest"
                    >×</button>
                  </div>
                ))}
              </div>
              <button
                onClick={() => updateGrant(g.id, { vests: [...g.vests, { date: `${year}-01-01`, shares: 0 }] })}
                className="mt-2 text-blue-600 hover:text-blue-700 text-xs"
              >+ Add vest</button>
            </div>
          </div>
        ))}
        <button onClick={addManual} className="text-blue-600 hover:text-blue-700 text-sm font-medium">+ Add grant manually</button>
      </div>
    </FormEditor>
  );
}
