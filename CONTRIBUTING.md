# Contributing

## Objective

We're replacing the old backend, [polaris-api](https://github.com/polaris-maps/polaris-api), with this one. A lot of the old one doesn't work, including routing (which is the entire point of the app).

The iPhone app calls five endpoints, and they have to keep working exactly as they are:

| Endpoint                             | Used for                                 |
| ------------------------------------ | ---------------------------------------- |
| `GET /app/building/all`              | Building search and map pins             |
| `GET /app/building/:id`              | Picking favorite buildings in onboarding |
| `GET /app/indoorIssue/all`           | The reports list and report pins         |
| `POST /app/indoorIssue/add`          | Creating a report                        |
| `DELETE /app/indoorIssue/delete/:id` | Deleting a report                        |

After those, we add better reports, saved preferences, and routing on the server. Right now the app does routing on the phone.

`npm run seed` copies the buildings, doors, ramps, and reports from the old database into your local `luminary.db`, this should be helpful for testing.

`data/graph.json` is the map routing runs on: every walking path and road on campus from [OpenStreetMap](https://www.openstreetmap.org), as points and the connections between them. Each connection has its length in meters and whether it's stairs. `npm run graph` downloads a fresh copy. Run it when campus paths change and commit the new file.

Useful references:

- Old API: `https://polaris-api-dept-polaris.apps.cloudapps.unc.edu/app/building/all`
- The app's network code: `Polaris Maps/Polaris Maps/API/APIService.swift` in [Polaris-Maps](https://github.com/polaris-maps/Polaris-Maps)

## Stack

- TypeScript and Express 5, run with `tsx`
- SQLite through `@libsql/client`
- zod for checking request input
- vitest and supertest for tests
- deploy via vercel free

## Getting started

```bash
npm install
npm run seed
npm run dev
curl localhost:3000/app/building/all
```

## Looking at the database

Everyone has their own `luminary.db`. It's not committed, so you can't break anyone else's. `npm run seed` resets it.

When you open the project, VS Code will suggest two extensions. Install both.

- **SQLite Viewer**: click `luminary.db` in the file list to browse the tables.
- **SQLite**: open the command palette, run `SQLite: New Query`, pick `luminary.db`, write your SQL, then run `SQLite: Run Query`.

## Project structure

```text
src/
  routes/        which URL goes to which controller
  controllers/   read the request, call a service, send the response
  services/      the logic and rules
  repositories/  the SQL
  schemas/       types and zod schemas
  middleware/    the error handler
  utils/         small helpers
  db/            the connection and table definitions
scripts/         seed.ts and other one-off scripts
data/            graph.json, the campus walking map for routing
```

A request always goes route, then controller, then service, then repository. Look at the buildings endpoint for an example of each layer.

- File names are camelCase and end with their layer, like `buildingService.ts`.
- Keep it simple. Plain functions, `async`/`await`, no comments.
- SQL only goes in repositories, always with `?` placeholders.
- New tables go at the bottom of `src/db/tables.ts`.
- Errors always look like `{ "status": 404, "message": "Building not found" }`. Send one with `throw new HttpError(404, "Building not found")`.

## Git

- Branch off an up-to-date `main`. Name it `feature/<your initials>/<short-name>` or `bugfix/<your initials>/<short-name>`, like `feature/jr/report-photos`.
- One ticket per branch and per pull request.
- Put the ticket name in the PR title and link the ticket in the description.
- Move your ticket to Code Review when the PR is up.
- Every PR needs one approval. The reviewer merges with **Squash and merge**.
- do not commit `luminary.db`
