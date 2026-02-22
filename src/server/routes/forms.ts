import { Router, type Request, type Response } from 'express';
import * as storage from '../storage.js';

const router = Router();

// GET /api/years/:year/data
router.get('/:year/data', (req: Request, res: Response) => {
  const year = parseInt(req.params.year, 10);
  if (!storage.yearExists(year)) {
    res.status(404).json({ error: `Year ${year} not found` });
    return;
  }
  res.json(storage.readYearData(year));
});

// PUT /api/years/:year/data
router.put('/:year/data', (req: Request, res: Response) => {
  const year = parseInt(req.params.year, 10);
  if (!storage.yearExists(year)) {
    res.status(404).json({ error: `Year ${year} not found` });
    return;
  }
  try {
    storage.writeYearData(year, { ...req.body, year });
    res.json(storage.readYearData(year));
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

// PATCH /api/years/:year/data
router.patch('/:year/data', (req: Request, res: Response) => {
  const year = parseInt(req.params.year, 10);
  if (!storage.yearExists(year)) {
    res.status(404).json({ error: `Year ${year} not found` });
    return;
  }
  try {
    const data = storage.mergeYearData(year, req.body);
    res.json(data);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

// GET /api/years/:year/forms/:form
router.get('/:year/forms/:form', (req: Request, res: Response) => {
  const year = parseInt(req.params.year, 10);
  const form = req.params.form;
  if (!storage.yearExists(year)) {
    res.status(404).json({ error: `Year ${year} not found` });
    return;
  }
  const data = storage.readYearData(year);
  const section = (data as any)[form];
  if (section === undefined) {
    res.status(404).json({ error: `Form ${form} not found` });
    return;
  }
  res.json(section);
});

// PUT /api/years/:year/forms/:form
router.put('/:year/forms/:form', (req: Request, res: Response) => {
  const year = parseInt(req.params.year, 10);
  const form = req.params.form;
  if (!storage.yearExists(year)) {
    res.status(404).json({ error: `Year ${year} not found` });
    return;
  }
  try {
    const data = storage.mergeYearData(year, { [form]: req.body });
    res.json((data as any)[form]);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

export default router;
