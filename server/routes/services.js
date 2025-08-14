import { Router } from 'express';
import { authenticateApp } from '../middleware/auth.js';
import { rateLimit } from '../middleware/rateLimit.js';
import { listServices, registerService, getService } from '../services.pluginRegistry.js';

const r = Router();
r.use(authenticateApp);
r.use(rateLimit(()=>'services'));

r.get('/', (req, res) => res.json({ services: listServices() }));
r.post('/register', (req, res) => {
  const { name, url, meta } = req.body || {};
  if (!name || !url) return res.status(400).json({ error: 'name and url required' });
  const out = registerService(name, url, meta);
  res.json(out);
});
r.get('/:name', (req, res) => {
  const svc = getService(req.params.name);
  if (!svc) return res.status(404).json({ error: 'not found' });
  res.json(svc);
});

export default r;
