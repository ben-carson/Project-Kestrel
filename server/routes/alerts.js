import { Router } from 'express';
import { authenticateApp } from '../middleware/auth.js';
import { rateLimit } from '../middleware/rateLimit.js';

const r = Router();
r.use(authenticateApp);
r.use(rateLimit(()=>'alerts'));

r.get('/', (req, res) => {
  res.json({
    items: [
      { id: 'a1', severity: 'warning', text: 'Disk usage 82% on db01' },
      { id: 'a2', severity: 'critical', text: 'Packet loss 12% to core-sw2' }
    ]
  });
});

export default r;
