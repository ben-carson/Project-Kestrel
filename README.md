# Project Kestrel — Bootstrap with SSE Bridge + ESLint

- Single `package.json`, unified installs.
- Vite + React + Tailwind (strict TS).
- Express API with `.env` handling, auth, rate limiting, prod static serving.
- **SSE bridge** wired on the frontend (`/api/events` → EventBus).
- **ESLint** configured with modern flat config.

## Install
```bash
cp .env.example .env
npm install
npm run dev
```

## SSE Bridge
- Frontend file: `src/lib/sseBridge.ts`
- Requires `AppRegistry` to include an app `kestrel-core` with `events:publish` permission.
- This package includes a minimal `src/components/os/apps/AppRegistry.ts` to add that entry.
  Merge it with your existing registry if you already have one.

## Lint
```bash
npm run lint
```

## Production
```bash
npm run build
npm start
```
Serves `dist/` and API on the same port.
