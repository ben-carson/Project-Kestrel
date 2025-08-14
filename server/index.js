import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import routes from './routes/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';

app.use(cors());
app.use(express.json({ limit: '2mb' }));
if (NODE_ENV === 'development') app.use(morgan('dev'));

// SSE hub
const clients = new Set();
app.get('/api/events', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });
  res.write(`event: ready\n`);
  res.write(`data: ${JSON.stringify({ ok: true, ts: Date.now() })}\n\n`);
  clients.add(res);
  req.on('close', () => clients.delete(res));
});
export function broadcast(event, data) {
  for (const res of clients) {
    try {
      res.write(`event: ${event}\n`);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    } catch {}
  }
}

app.use('/api', routes);

// Serve frontend in production
if (NODE_ENV === 'production') {
  const dist = path.join(__dirname, '..', 'dist');
  app.use(express.static(dist));
  app.get('*', (req, res) => res.sendFile(path.join(dist, 'index.html')));
}

app.listen(PORT, () => console.log(`[kestrel-api] ${NODE_ENV} http://localhost:${PORT}`));
