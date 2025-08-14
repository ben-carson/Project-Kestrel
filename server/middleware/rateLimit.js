const buckets = new Map();
const CAP = 20;
const REFILL = 20; // tokens per second

export const rateLimit = (scopeProvider = ()=>'default') => (req, res, next) => {
  const key = `${req.appId || 'anon'}:${scopeProvider(req)}`;
  const now = Date.now();
  const b = buckets.get(key) || { tokens: CAP, last: now };
  const elapsed = (now - b.last) / 1000;
  b.tokens = Math.min(CAP, b.tokens + elapsed * REFILL);
  b.last = now;
  if (b.tokens < 1) return res.status(429).json({ error: 'Rate limit exceeded' });
  b.tokens -= 1;
  buckets.set(key, b);
  next();
};
