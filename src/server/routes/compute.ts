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
  const result = computeTax(data, config);
  res.json(result);
});

export default router;
