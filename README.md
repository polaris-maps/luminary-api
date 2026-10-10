# luminary-api

The backend for [Luminary](https://github.com/polaris-maps/Polaris-Maps), the accessible campus navigation app.

## Run it

```bash
npm install
npm run seed
npm run dev
curl localhost:3000/app/building/all
```

| Command | What it does |
|---|---|
| `npm run dev` | Start the server at `http://localhost:3000`. It restarts when you save. |
| `npm run seed` | Copy the old database's data into `luminary.db` |
| `npm run build` | Check for type errors |

## Endpoints so far

| Method | Path | Returns |
|---|---|---|
| GET | `/app/` | `{ "message": "Health Check (200)" }` |
| GET | `/app/health` | `{ "status": "ok", "db": "ok" }` |
| GET | `/app/building/all` | Every building, in the shape the iPhone app reads |

Read [CONTRIBUTING.md](CONTRIBUTING.md) before you start. It covers the stack, the project structure, how we're migrating from the old backend, and our git rules.
