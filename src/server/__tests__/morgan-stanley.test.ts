import { describe, it, expect } from 'vitest';
import { parseMorganStanleyGrant, parseMSDate } from '../../shared/morgan-stanley.js';

// Synthetic fixture mirroring the structure of a Morgan Stanley "Employee Grant Details" export.
const row = (date: string, cum: string, granted: string, forfeited: string, distributed: string, outstanding: string) => `
  <tr bgcolor="#ffffff" onMouseOver="this.bgColor='#aad5e4';">
    <td align="center" class="newReportCellStyle" nowrap> ${date} </td>
    <td align="right" class="newReportCellStyle"> ${cum} </td>
    <td align="right" class="newReportCellStyle"> ${granted} </td>
    <td align="right" class="newReportCellStyle"> ${forfeited} </td>
    <td align="right" class="newReportCellStyle"> ${distributed} </td>
    <td align="right" class="newReportCellStyle"> ${outstanding} </td>
    <td align="center" class="newReportCellStyle" nowrap> 01-Jan-2032 </td>
  </tr>`;

const fixture = `
<html><head><script>var x = "<table id='Vest Schedule - fake'><tr><td>01-Jan-2020</td></tr></table>";</script></head>
<body><div id="sw-contentMain">
  <h3>Company Name: Example Corp &amp; Co</h3>
  <p>
    <strong>Grant Name: </strong> 01 JAN 2025 RSU Grant<br>
    <strong>Grant Date:</strong> 01-Jan-2025<br>
    <strong>Employee Name:</strong> Jane Doe<br>
  </p>
  <table class='sw-datatable' id="Vest Schedule - Share Units (RSU)_table">
    <tr class="newReportTitleStyle"><th colspan="7">Vest Schedule - Share Units (RSU)</th></tr>
    <tr><th rowspan="2">Vest Date</th><th colspan="5">Share Units (RSU)</th><th rowspan="2">Expire/Cancel Date</th></tr>
    <tr><th>Total Potential Vesting At Date</th><th>Granted</th><th>Forfeited</th><th>Distributed</th><th>Outstanding</th></tr>
    ${row('15-Feb-2026', '1,000', '1,000', '0', '1,000', '0')}
    ${row('15-May-2026', '1,250', '250', '50', '0', '200')}
    ${row('15-Aug-2026', '1,500', '250', '0', '0', '250')}
    <tr>
      <td class="newReportCellStyle tmHighlightBold"><span aria-label="blank"></span></td>
      <td class="newReportCellStyle tmHighlightBold"><span aria-label="blank"></span></td>
      <td class="newReportCellStyle tmHighlightBold"> 1,500 </td>
      <td class="newReportCellStyle tmHighlightBold"> 50 </td>
      <td class="newReportCellStyle tmHighlightBold"> 1,000 </td>
      <td class="newReportCellStyle tmHighlightBold"> 450 </td>
      <td class="newReportCellStyle tmHighlightBold"><span aria-label="blank"></span></td>
    </tr>
  </table>
</div></body></html>`;

describe('parseMorganStanleyGrant', () => {
  it('extracts grant fields and vests (granted − forfeited), skipping the totals row', () => {
    const g = parseMorganStanleyGrant(fixture);
    expect(g.company).toBe('Example Corp & Co');
    expect(g.grantName).toBe('01 JAN 2025 RSU Grant');
    expect(g.grantDate).toBe('2025-01-01');
    expect(g.vests).toEqual([
      { date: '2026-02-15', shares: 1000 },
      { date: '2026-05-15', shares: 200 },
      { date: '2026-08-15', shares: 250 },
    ]);
  });

  it('does not expose personal fields', () => {
    expect(JSON.stringify(parseMorganStanleyGrant(fixture))).not.toContain('Jane Doe');
  });

  it('ignores tables inside scripts', () => {
    const g = parseMorganStanleyGrant(fixture);
    expect(g.vests.some((v) => v.date === '2020-01-01')).toBe(false);
  });

  it('rejects files without a vest schedule', () => {
    expect(() => parseMorganStanleyGrant('<html><body>hi</body></html>')).toThrow(/Vest Schedule/);
  });

  it('parses Morgan Stanley dates', () => {
    expect(parseMSDate('18-Nov-2026')).toBe('2026-11-18');
    expect(parseMSDate('5-Feb-2027')).toBe('2027-02-05');
    expect(parseMSDate('')).toBeNull();
  });
});
