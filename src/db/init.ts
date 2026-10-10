import { db } from "./client";
import { tables } from "./tables";

// Creates any missing tables. Called once when the server starts.
export async function initDb(): Promise<void> {
  await db.executeMultiple(tables);
}
