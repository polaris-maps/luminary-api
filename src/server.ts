import app from "./app";
import { initDb } from "./db/init";

const port = process.env.PORT || 3000;

await initDb();
app.listen(port, () => console.log(`Listening on http://localhost:${port}`));
