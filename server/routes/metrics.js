import { Router } from 'express';
import { authenticateApp } from '../middleware/auth.js';
import { rateLimit } from '../middleware/rateLimit.js';
import { broadcast } from '../index.js';

const r = Router();
r.use(authenticateApp);
r.use(rateLimit(()=>'metrics'));

r.get('/trend', (req, res) => {
  const points = Array.from({ length: 60 }, (_, i) => ({
    t: Date.now() - (60 - i) * 60_000,
    cpu: Math.round(20 + Math.random() * 40),
    mem: Math.round(30 + Math.random() * 30),
    iops: Math.round(200 + Math.random() * 300)
  }));
  res.json({ points });
});

r.post('/emit-breach', (req, res) => {
  const event = {
    version: '1.0',
    metric: 'cpu',
    value: Math.round(80 + Math.random() * 20),
    threshold: 85,
    at: Date.now()
  };
  broadcast('threshold.breach', event);
  res.json({ ok: true });
});

export default r;
