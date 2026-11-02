import { Router, type Request, type Response } from 'express';
import * as storage from '../storage.js';
import { computeTax } from '../engine/index.js';

const router = Router();

// GET /api/years/:year/compute
router.get('/:year/compute', (req: Request, res: Response) => {
  const year = parseInt(req.params.year, 10);
  if (!storage.yearExists(year)) {
    res.status(404).json({ error: `Year ${year} not found` });
    return;
  }
  const data = storage.readYearData(year);
  const config = storage.readYearConfig(year);
  // Fallback prior-year amounts for the safe harbor, from the app's own prior-year data
  let computedPriorYear;
  if (storage.yearExists(year - 1)) {
    const prior = computeTax(storage.readYearData(year - 1), storage.readYearConfig(year - 1));
    computedPriorYear = {
      federalTotalTax: prior.federal.totalTax,
      federalAgi: prior.federal.agi,
      coloradoNetTax: prior.colorado.coloradoTax,
    };
  }
  const result = computeTax(data, config, { computedPriorYear });
  res.json(result);
});

export default router;
