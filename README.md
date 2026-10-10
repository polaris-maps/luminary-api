# luminary-api

Backend for [Luminary](https://github.com/polaris-maps/Polaris-Maps), the accessible campus navigation app.
TypeScript + Express 5 + SQLite (`@libsql/client`).

## Run it on your laptop

```bash
npm install
npm run seed   # creates luminary.db and fills it with real campus data
npm run dev    # http://localhost:3000
curl localhost:3000/app/
```

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the server and restart on file changes |
| `npm run seed` | Copy buildings, doors, ramps, and reports from the old API into `luminary.db` |
| `npm run build` | Type-check everything |

## Layout

```text
src/
  app.ts          builds the Express app (export default app)
  server.ts       creates the tables, then starts listening
  db.ts           the SQLite connection (DATABASE_URL, defaults to file:luminary.db)
  schema.ts       every CREATE TABLE; append new tables at the bottom
  initDb.ts       runs schema.ts
  routes/         one file per resource
scripts/seed.ts   npm run seed
test/fixtures/    small JSON snapshots used by tests
```

## Endpoints so far

| Method | Path | Notes |
|---|---|---|
| GET | `/app/` | Smoke test |
| GET | `/app/health` | `{ "status": "ok", "db": "ok" }` |
| GET | `/app/building/all` | Every building, in the exact shape the iPhone app reads |

Work is tracked on the Luminary Notion board as `[Backend-Rewrite NN]` tickets. Start with `[Backend-Rewrite 00]`.
