import { db } from "./client";
import { tables } from "./tables";

export async function initDb() {
  await db.executeMultiple(tables);
}
