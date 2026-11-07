import { db } from "./client.js";
import { tables } from "./tables.js";

export async function initDb() {
  await db.executeMultiple(tables);
}
