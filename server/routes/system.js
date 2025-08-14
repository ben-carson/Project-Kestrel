import { Router } from 'express';
const r = Router();

r.get('/info', (req, res) => {
  res.json({ name: 'Project Kestrel', version: '0.2.1', nodes: 42, services: 5 });
});

export default r;
