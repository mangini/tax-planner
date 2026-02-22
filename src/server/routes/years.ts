import { Router, type Request, type Response } from 'express';
import * as storage from '../storage.js';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  res.json(storage.listYears());
});

router.post('/', (req: Request, res: Response) => {
  const { year, cloneFrom } = req.body;
  if (!year || typeof year !== 'number') {
    res.status(400).json({ error: 'year is required' });
    return;
  }
  if (storage.yearExists(year)) {
    res.status(409).json({ error: `Year ${year} already exists` });
    return;
  }
  const data = storage.createYear(year, cloneFrom);
  res.status(201).json(data);
});

router.delete('/:year', (req: Request, res: Response) => {
  const year = parseInt(req.params.year, 10);
  if (!storage.yearExists(year)) {
    res.status(404).json({ error: `Year ${year} not found` });
    return;
  }
  storage.deleteYear(year);
  res.status(204).send();
});

export default router;
