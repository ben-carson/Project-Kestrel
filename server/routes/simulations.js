import { Router } from 'express';
import { authenticateApp } from '../middleware/auth.js';
import { rateLimit } from '../middleware/rateLimit.js';
import { broadcast } from '../index.js';

const r = Router();
r.use(authenticateApp);
r.use(rateLimit(()=>'simulations'));

r.post('/run', async (req, res) => {
  const { scenario = 'default' } = req.body || {};
  const id = `sim_${Date.now()}`;
  setTimeout(() => {
    broadcast('simulation.complete', { version: '1.0', id, result: { status: 'ok' } });
  }, 500);
  res.json({ id, scenario, status: 'queued' });
});

export default r;
