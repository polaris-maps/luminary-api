import { query } from "../db/client";

// Throws if the database cannot be reached.
export async function ping(): Promise<void> {
  await query("SELECT 1");
}
