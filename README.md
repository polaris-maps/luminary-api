# luminary-api

The backend for [Luminary](https://github.com/polaris-maps/Polaris-Maps), the accessible campus navigation app.
Built with TypeScript, Express, and SQLite.

## Run it

```bash
npm install
npm run seed   # creates luminary.db and fills it with real campus data
npm run dev    # starts the server at http://localhost:3000
curl localhost:3000/app/building/all
```

| Command | What it does |
|---|---|
| `npm run dev` | Start the server. It restarts when you save a file. |
| `npm run seed` | Copy buildings, doors, ramps, and reports from the old API into `luminary.db` |
| `npm run build` | Check the code for type errors |

## How the code is organized

```text
src/
  routes/        which URL goes to which controller
  controllers/   read the request, call a service, send the response
  services/      the logic and rules
  repositories/  the SQL
  schemas/       the shapes of the data (types and zod schemas)
  middleware/    the 404 handler and the error handler
  utils/         small helpers
  db/            the database connection and table definitions
  app.ts         puts it all together
  server.ts      starts the server
scripts/         one-off scripts like seed.ts
```

A request always moves through the layers in the same order:

```text
route  ->  controller  ->  service  ->  repository  ->  database
```

Each layer has one job:

| Layer | Does | Never does |
|---|---|---|
| Route | Connects a URL to a controller function | Anything else |
| Controller | Reads `req`, checks input with a schema, calls a service, sends `res.json(...)` | SQL or rules |
| Service | Makes decisions, shapes data for the app, throws `HttpError` when something is wrong | Touch `req`, `res`, or SQL |
| Repository | Runs SQL and returns rows | Make decisions |
| Schema | Describes data | Contain logic |

## Example: GET /app/building/all

Each file is a few lines. To add an endpoint, copy this pattern.

```ts
// routes/buildingRoutes.ts
router.get("/app/building/all", buildingController.getAllBuildings);

// controllers/buildingController.ts
export async function getAllBuildings(req: Request, res: Response): Promise<void> {
  const buildings = await buildingService.getAllBuildings();
  res.json(buildings);
}

// services/buildingService.ts
export async function getAllBuildings(): Promise<AppBuilding[]> {
  const rows = await buildingRepository.findAll();
  return rows.map(toAppBuilding);
}

// repositories/buildingRepository.ts
export async function findAll(): Promise<BuildingRow[]> {
  return query<BuildingRow>("SELECT * FROM building ORDER BY id");
}
```

## Errors

Every error response has the same shape, a status code and a message:

```json
{ "status": 404, "message": "Building not found" }
```

To send one, throw an `HttpError` from a service or controller:

```ts
throw new HttpError(404, "Building not found");
```

The error handler in `middleware/errorHandler.ts` does the rest:

| What happened | Status | Message |
|---|---|---|
| You threw `HttpError(status, message)` | your status | your message |
| Input failed a zod schema | 400 | what was wrong, like `id: Too small: expected number to be >0` |
| The JSON body could not be read | 400 | `Request body is not valid JSON` |
| No route matched the URL | 404 | `Route not found: GET /app/nope` |
| Any other error | 500 | `Something went wrong` |

## Rules

- **File names** are camelCase and end with their layer: `buildingRoutes.ts`, `buildingController.ts`, `buildingService.ts`, `buildingRepository.ts`, `buildingSchema.ts`.
- **Plain functions.** The only class is `HttpError`.
- **`async` / `await`** everywhere.
- **Import a layer as a module**, so the call says where it goes: `import * as buildingService from "../services/buildingService";`
- **Controllers pass plain values** like `id` to services, never `req`.
- **SQL only in repositories**, always with `?` placeholders: `query("SELECT * FROM building WHERE id = ?", [id])`. Scripts in `scripts/` are the one exception.
- **New tables** go at the bottom of `src/db/tables.ts`. They are created when the server starts.

## Endpoints so far

| Method | Path | Returns |
|---|---|---|
| GET | `/app/` | `{ "message": "Your API works! (200)" }` |
| GET | `/app/health` | `{ "status": "ok", "db": "ok" }` |
| GET | `/app/building/all` | Every building, in the exact shape the iPhone app reads |

Work is tracked on the Luminary Notion board as `[Backend-Rewrite NN]` tickets. Start with `[Backend-Rewrite 00]`.
