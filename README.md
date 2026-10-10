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

Read [ARCHITECTURE.md](ARCHITECTURE.md) before writing code. Short version:

```text
src/
  app.ts            builds the Express app (export default app)
  server.ts         creates the tables, then starts listening
  routes/           URL -> controller function
  controllers/      request in, response out
  services/         logic and rules
  repositories/     SQL
  schemas/          types and zod schemas
  db/               connection (client.ts), tables (tables.ts), startup (init.ts)
scripts/seed.ts     npm run seed
test/fixtures/      small JSON snapshots used by tests
```

## Endpoints so far

| Method | Path | Notes |
|---|---|---|
| GET | `/app/` | Smoke test |
| GET | `/app/health` | `{ "status": "ok", "db": "ok" }` |
| GET | `/app/building/all` | Every building, in the exact shape the iPhone app reads |

Work is tracked on the Luminary Notion board as `[Backend-Rewrite NN]` tickets. Start with `[Backend-Rewrite 00]`.
