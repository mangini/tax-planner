import { Router, type Request, type Response } from 'express';
import * as storage from '../storage.js';
import { config2025 } from '../../shared/tax-config-2025.js';
import { config2026 } from '../../shared/tax-config-2026.js';

const router = Router();

// GET /api/years/:year/config
router.get('/:year/config', (req: Request, res: Response) => {
  const year = parseInt(req.params.year, 10);
  res.json(storage.readYearConfig(year));
});

// PUT /api/years/:year/config
router.put('/:year/config', (req: Request, res: Response) => {
  const year = parseInt(req.params.year, 10);
  try {
    storage.writeYearConfig(year, { ...req.body, year });
    res.json(storage.readYearConfig(year));
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

// PATCH /api/years/:year/config
router.patch('/:year/config', (req: Request, res: Response) => {
  const year = parseInt(req.params.year, 10);
  try {
    const config = storage.mergeYearConfig(year, req.body);
    res.json(config);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

// POST /api/years/:year/config/reset
router.post('/:year/config/reset', (req: Request, res: Response) => {
  const year = parseInt(req.params.year, 10);
  const defaults = year === 2026 ? { ...config2026 } : { ...config2025, year };
  storage.writeYearConfig(year, defaults);
  res.json(defaults);
});

export default router;
