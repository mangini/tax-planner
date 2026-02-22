import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import yearsRouter from './routes/years.js';
import formsRouter from './routes/forms.js';
import configRouter from './routes/config.js';
import computeRouter from './routes/compute.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = parseInt(process.env.PORT || '3456', 10);

app.use(express.json({ limit: '5mb' }));

// API routes
app.use('/api/years', yearsRouter);
app.use('/api/years', formsRouter);
app.use('/api/years', configRouter);
app.use('/api/years', computeRouter);

// Foreign accounts routes (convenience endpoints)
app.get('/api/years/:year/foreign-accounts', (req, res) => {
  import('./storage.js').then(({ readYearData, yearExists }) => {
    const year = parseInt(req.params.year, 10);
    if (!yearExists(year)) { res.status(404).json({ error: 'Year not found' }); return; }
    const data = readYearData(year);
    res.json(data.foreignAccounts);
  });
});

app.post('/api/years/:year/foreign-accounts', (req, res) => {
  import('./storage.js').then(({ readYearData, writeYearData, yearExists }) => {
    const year = parseInt(req.params.year, 10);
    if (!yearExists(year)) { res.status(404).json({ error: 'Year not found' }); return; }
    const data = readYearData(year);
    data.foreignAccounts.push(req.body);
    writeYearData(year, data);
    res.status(201).json(req.body);
  });
});

app.put('/api/years/:year/foreign-accounts/:id', (req, res) => {
  import('./storage.js').then(({ readYearData, writeYearData, yearExists }) => {
    const year = parseInt(req.params.year, 10);
    if (!yearExists(year)) { res.status(404).json({ error: 'Year not found' }); return; }
    const data = readYearData(year);
    const idx = data.foreignAccounts.findIndex((a) => a.id === req.params.id);
    if (idx === -1) { res.status(404).json({ error: 'Account not found' }); return; }
    data.foreignAccounts[idx] = { ...req.body, id: req.params.id };
    writeYearData(year, data);
    res.json(data.foreignAccounts[idx]);
  });
});

app.delete('/api/years/:year/foreign-accounts/:id', (req, res) => {
  import('./storage.js').then(({ readYearData, writeYearData, yearExists }) => {
    const year = parseInt(req.params.year, 10);
    if (!yearExists(year)) { res.status(404).json({ error: 'Year not found' }); return; }
    const data = readYearData(year);
    data.foreignAccounts = data.foreignAccounts.filter((a) => a.id !== req.params.id);
    writeYearData(year, data);
    res.status(204).send();
  });
});

// Serve static files in production
const clientDist = path.resolve(__dirname, '../../dist/client');
app.use(express.static(clientDist));
app.get('*', (_req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Tax server running on http://localhost:${PORT}`);
});
