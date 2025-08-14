export const authenticateApp = (req, res, next) => {
  const appId = req.headers['x-app-id'];
  const token = (req.headers['authorization'] || '').replace('Bearer ', '');
  if (!appId || !token) return res.status(401).json({ error: 'Missing app credentials' });
  // TODO validate token
  req.appId = appId;
  next();
};
