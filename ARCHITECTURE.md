# How the code is organized

Every request passes through the same five layers, in the same order:

```text
request
  -> routes/        which URL goes to which controller function
  -> controllers/   read the request, call a service, send the response
  -> services/      the logic and rules
  -> repositories/  the SQL
  -> database
```

`schemas/` sits beside them and holds the shapes of the data. Every layer uses it.

## The rules

| Folder | Put here | Never put here |
|---|---|---|
| `routes/` | `router.get(path, controller.fn)` lines | Logic, SQL, `req.body` |
| `controllers/` | Read `req.params` / `req.query` / `req.body` / headers, check them with a schema, call a service, send the response with `res.json(...)` | SQL, business rules |
| `services/` | Rules and decisions, turning database rows into the shape the app reads, and `throw new HttpError(404, "not_found")` when something is missing or not allowed | `req`, `res`, SQL |
| `repositories/` | SQL queries, one small function each | `req`, `res`, business rules |
| `schemas/` | TypeScript types for rows and responses, and zod schemas for request input | Logic of any kind |
| `db/` | The connection, the list of tables, startup | Anything feature-specific |

More folders appear as tickets need them:

- `utils/` holds small helpers with no app knowledge, like the distance math, the profanity filter, and `HttpError`.
- `middleware/` holds Express middleware, like the 404 and error handlers.
- `data/` holds data loaded into memory instead of the database, like the obstacle list and the walking map.

## Naming

One file per resource per layer, named `<resource>.<layer>.ts`:

```text
routes/building.routes.ts
controllers/building.controller.ts
services/building.service.ts
repositories/building.repository.ts
schemas/building.schema.ts
```

## Style

- Plain exported functions. No classes, no `this`.
- `async` / `await` everywhere. No `.then()` chains.
- Write explicit return types on exported functions.
- Import a layer as a whole module so the call site says where it goes:

```ts
import * as buildingService from "../services/building.service";

const buildings = await buildingService.getAllBuildings();
```

- Repositories use the two helpers in `db/client.ts`, and always pass values as `?` arguments, never by building strings:

```ts
query<BuildingRow>("SELECT * FROM building WHERE id = ?", [id]);     // many rows
queryOne<BuildingRow>("SELECT * FROM building WHERE id = ?", [id]);  // one row or null
```

## Adding an endpoint: worked example

This is how `GET /app/building/all` is built. Copy the pattern.

**1. Schema** (`schemas/building.schema.ts`): describe the row and the response.

```ts
export type BuildingRow = { id: number; full_name: string; /* ... */ };
export type AppBuilding = { location_id: number; full_name: string; /* ... */ };
```

**2. Repository** (`repositories/building.repository.ts`): the SQL.

```ts
export async function findAll(): Promise<BuildingRow[]> {
  return query<BuildingRow>("SELECT * FROM building ORDER BY id");
}
```

**3. Service** (`services/building.service.ts`): the logic, including converting rows to what the app reads.

```ts
export async function getAllBuildings(): Promise<AppBuilding[]> {
  const rows = await buildingRepository.findAll();
  return rows.map(toAppBuilding);
}
```

**4. Controller** (`controllers/building.controller.ts`): request in, response out.

```ts
export async function getAllBuildings(_req: Request, res: Response): Promise<void> {
  const buildings = await buildingService.getAllBuildings();
  res.json(buildings);
}
```

**5. Route** (`routes/building.routes.ts`): connect the URL.

```ts
router.get("/app/building/all", buildingController.getAllBuildings);
```

**6. App** (`app.ts`): only for a brand-new routes file, add one line.

```ts
app.use(buildingRoutes);
```

## When there is request input or an error

- **Checking input** belongs in the **controller**, using a zod schema from `schemas/`.
- **Saying no** belongs in the **service**. Throw an `HttpError` when something is missing or not allowed. The error handler (ticket Backend-Rewrite 04) turns it into the right status and JSON.

For example, ticket Backend-Rewrite 06 will add:

```ts
// schemas/building.schema.ts
export const buildingIdParams = z.object({ id: z.coerce.number().int().positive() });

// repositories/building.repository.ts
export async function findById(id: number): Promise<BuildingRow | null> {
  return queryOne<BuildingRow>("SELECT * FROM building WHERE id = ?", [id]);
}

// services/building.service.ts
export async function getBuilding(id: number): Promise<AppBuilding> {
  const row = await buildingRepository.findById(id);
  if (!row) throw new HttpError(404, "not_found");
  return toAppBuilding(row);
}

// controllers/building.controller.ts
export async function getBuilding(req: Request, res: Response): Promise<void> {
  const { id } = buildingIdParams.parse(req.params);
  const building = await buildingService.getBuilding(id);
  res.json(building);
}
```

Controllers pass plain values to services, like `id` or `deviceId`, never `req` itself.

## Database tables

All tables live in `db/tables.ts`. A ticket that needs a new table appends it to the bottom of that string. Tables are created automatically when the server starts.

Scripts in `scripts/` such as `seed.ts` are the only code outside `repositories/` allowed to write SQL.
