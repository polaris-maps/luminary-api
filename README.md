# luminary-api

The previous backend for [Luminary](https://github.com/polaris-maps/Polaris-Maps)

## Running this app

```bash
npm install
npm run seed
npm run dev
curl localhost:3000/app/building/all
```

| Command         | What it does                                                            |
| --------------- | ----------------------------------------------------------------------- |
| `npm run dev`   | Start the server at `http://localhost:3000`. It restarts when you save. |
| `npm run seed`  | Copy the old database's data into `luminary.db`                         |
| `npm run graph` | Download campus walking paths into `data/graph.json`                    |
| `npm run build` | Check for type errors                                                   |
| `npm test`      | Run the tests                                                           |

Read [CONTRIBUTING.md](CONTRIBUTING.md) before you start. It covers the stack, the project structure, how we're migrating from the old backend, and our git rules.
