import { db } from "./db";
import { schema } from "./schema";

export async function initDb(): Promise<void> {
  await db.executeMultiple(schema);
}
